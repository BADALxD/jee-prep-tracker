"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChapterRow } from "@/components/subjects/ChapterRow";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Chapter, ChapterProgress, ChapterRevision, SubjectName, ChemistrySection } from "@/types";
import {
  ensureRevisionsExist,
  needsBackfill,
  deleteRevisions,
  canCompleteRevision,
  getCascadeCompletionIds,
} from "@/lib/revisions";

interface SubjectChapterListProps {
  subject: SubjectName;
  chapters: Chapter[];
  initialProgressData: ChapterProgress[];
  initialRevisionsData: ChapterRevision[];
  userId: string;
  showSections?: boolean;
}

const SECTIONS: ChemistrySection[] = ["Physical", "Inorganic", "Organic"];

const SECTION_COLORS: Record<ChemistrySection, string> = {
  Physical: "bg-blue-500/10 text-blue-400",
  Inorganic: "bg-emerald-500/10 text-emerald-400",
  Organic: "bg-amber-500/10 text-amber-400",
};

/**
 * Maps UI field name → actual DB column name.
 * "mock_completed" in UI → "practice_completed" in Supabase.
 */
type UIField = "theory_completed" | "module_completed" | "pyq_completed" | "mock_completed";
type DBField = "theory_completed" | "module_completed" | "pyq_completed" | "practice_completed";

function toDbField(field: UIField): DBField {
  return field === "mock_completed" ? "practice_completed" : field;
}

/** Bare minimum columns that exist in the real chapter_progress table. */
function makeOptimisticRow(
  userId: string,
  chapterId: string,
  dbField: DBField,
  value: boolean
): ChapterProgress {
  return {
    id: `__temp__${chapterId}`,   // sentinel — never sent to DB
    user_id: userId,
    chapter_id: chapterId,
    theory_completed: false,
    module_completed: false,
    practice_completed: false,
    pyq_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    [dbField]: value,
  } as unknown as ChapterProgress;
}

export function SubjectChapterList({
  chapters,
  initialProgressData,
  initialRevisionsData,
  userId,
  showSections = false,
}: SubjectChapterListProps) {
  const [progressMap, setProgressMap] = useState<Map<string, ChapterProgress>>(() => {
    const m = new Map<string, ChapterProgress>();
    initialProgressData.forEach((p) => m.set(p.chapter_id, p));
    return m;
  });

  // ── Revisions state: chapterId -> revision rows ──
  const [revisionsMap, setRevisionsMap] = useState<Map<string, ChapterRevision[]>>(() => {
    const m = new Map<string, ChapterRevision[]>();
    initialRevisionsData.forEach((r) => {
      const list = m.get(r.chapter_id) ?? [];
      list.push(r);
      m.set(r.chapter_id, list);
    });
    return m;
  });

  /**
   * Tracks in-flight inserts so a second click while an insert is pending
   * doesn't fire an update against a temp id.
   * Key: chapterId  Value: Promise that resolves to the real DB row (or null on error)
   */
  const pendingInserts = useRef<Map<string, Promise<ChapterProgress | null>>>(new Map());

  const supabase = createClient();

  // ── Backfill: on first mount, generate revisions for chapters where Theory
  // is already true but no revision rows exist yet. Best-effort — failures
  // are silent (non-blocking). ──
  useEffect(() => {
    const backfillTargets = chapters.filter((chapter) => {
      const progress = progressMap.get(chapter.id) ?? null;
      const existing = revisionsMap.get(chapter.id);
      return needsBackfill(progress, existing);
    });

    if (backfillTargets.length === 0) return;

    (async () => {
      for (const chapter of backfillTargets) {
        const created = await ensureRevisionsExist(
          supabase,
          userId,
          chapter.id,
          revisionsMap.get(chapter.id)
        );
        if (created.length > 0) {
          setRevisionsMap((prev) => {
            const next = new Map(prev);
            next.set(chapter.id, created);
            return next;
          });
        }
      }
    })();
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateProgress(chapterId: string, field: UIField, value: boolean) {
    const dbField = toDbField(field);

    // ── Wait for any in-flight insert on this chapter to finish first ──
    const inflight = pendingInserts.current.get(chapterId);
    if (inflight) {
      await inflight;
    }

    const existing = progressMap.get(chapterId);

    // ── Guard: Module/PYQ/Mock cannot be toggled while Theory is false ──
    if (dbField !== "theory_completed") {
      const theoryDone =
        existing && !existing.id.startsWith("__temp__")
          ? existing.theory_completed
          : false;
      if (!theoryDone) {
        toast.error("Complete Theory first");
        return;
      }
    }

    // ── INSERT path (no row yet, or only a temp sentinel) ──
    if (!existing || existing.id.startsWith("__temp__")) {
      // Apply optimistic update immediately
      const optimistic = makeOptimisticRow(userId, chapterId, dbField, value);
      setProgressMap((prev) => new Map(prev).set(chapterId, optimistic));

      const insertPromise: Promise<ChapterProgress | null> = Promise.resolve(
        supabase
          .from("chapter_progress")
          .insert({
            user_id: userId,
            chapter_id: chapterId,
            [dbField]: value,
          })
          .select("id, user_id, chapter_id, theory_completed, module_completed, practice_completed, pyq_completed, created_at, updated_at")
          .single()
      ).then(({ data, error }): ChapterProgress | null => {
          pendingInserts.current.delete(chapterId);
          if (error || !data) {
            toast.error("Failed to save progress");
            // Revert: remove the temp row so the next click retries insert
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.delete(chapterId);
              return next;
            });
            return null;
          }
          // Replace temp row with real DB row
          const realRow = data as ChapterProgress;
          setProgressMap((prev) => new Map(prev).set(chapterId, realRow));

          // ── Theory just became true on insert (only possible if dbField === "theory_completed" && value === true) ──
          if (dbField === "theory_completed" && value === true) {
            maybeCreateRevisions(chapterId);
          }

          return realRow;
        });

      pendingInserts.current.set(chapterId, insertPromise);
      return;
    }

    // ── UPDATE path (real row exists, id is a genuine UUID) ──

    // ── Theory true -> false: cascade-uncheck Module/PYQ/Mock and delete revisions ──
    if (dbField === "theory_completed" && value === false && existing.theory_completed === true) {
      const previous = existing;
      const updated: ChapterProgress = {
        ...existing,
        theory_completed: false,
        module_completed: false,
        pyq_completed: false,
        practice_completed: false,
      };
      setProgressMap((prev) => new Map(prev).set(chapterId, updated));

      // Optimistically clear revisions for this chapter
      const previousRevisions = revisionsMap.get(chapterId) ?? [];
      setRevisionsMap((prev) => {
        const next = new Map(prev);
        next.delete(chapterId);
        return next;
      });

      const { error } = await supabase
        .from("chapter_progress")
        .update({
          theory_completed: false,
          module_completed: false,
          pyq_completed: false,
          practice_completed: false,
        })
        .eq("id", existing.id)
        .eq("user_id", userId);

      if (error) {
        console.error("chapter_progress update error:", error);
        toast.error("Failed to save progress");
        setProgressMap((prev) => new Map(prev).set(chapterId, previous));
        setRevisionsMap((prev) => {
          const next = new Map(prev);
          next.set(chapterId, previousRevisions);
          return next;
        });
        return;
      }

      const deleted = await deleteRevisions(supabase, userId, chapterId);
      if (!deleted) {
        toast.error("Failed to clear revisions");
        // Progress update succeeded but revision delete failed — restore
        // revisions in local state so the UI stays consistent with DB.
        setRevisionsMap((prev) => {
          const next = new Map(prev);
          next.set(chapterId, previousRevisions);
          return next;
        });
      }

      return;
    }

    // ── Standard UPDATE path (single field toggle) ──
    const updated: ChapterProgress = { ...existing, [dbField]: value };
    setProgressMap((prev) => new Map(prev).set(chapterId, updated));

    const { error } = await supabase
      .from("chapter_progress")
      // Only send the single toggled column — don't touch updated_at (the trigger handles it)
      .update({ [dbField]: value })
      .eq("id", existing.id)
      .eq("user_id", userId); // extra safety: RLS guard matches this anyway

    if (error) {
      console.error("chapter_progress update error:", error);
      toast.error("Failed to save progress");
      // Revert to the pre-click state
      setProgressMap((prev) => new Map(prev).set(chapterId, existing));
      return;
    }

    // ── Theory false -> true: create revisions immediately ──
    if (dbField === "theory_completed" && value === true) {
      maybeCreateRevisions(chapterId);
    }
  }

  /**
   * Creates revision rows for a chapter if none exist yet.
   * Triggered the moment Theory becomes true (insert or update path).
   * Best-effort: failures here do not affect progress state / UI.
   */
  function maybeCreateRevisions(chapterId: string) {
    const existingRevisions = revisionsMap.get(chapterId);
    if (existingRevisions && existingRevisions.length > 0) return;

    (async () => {
      const created = await ensureRevisionsExist(supabase, userId, chapterId, existingRevisions);
      if (created.length > 0) {
        setRevisionsMap((prev) => {
          const next = new Map(prev);
          next.set(chapterId, created);
          return next;
        });
      }
    })();
  }

  /**
   * Marks a revision (and any earlier incomplete revisions) as completed.
   * Permanent — completed revisions can never be uncompleted, and there is
   * no forward cascade. Locked revisions (due_date in the future) cannot be
   * completed at all.
   * Optimistic update with rollback on failure.
   */
  async function completeRevision(chapterId: string, revisionId: string) {
    const currentList = revisionsMap.get(chapterId) ?? [];
    const target = currentList.find((r) => r.id === revisionId);

    if (!target) return;
    if (target.completed) return; // permanent — no-op
    if (!canCompleteRevision(target)) {
      toast.error("This revision isn't due yet");
      return;
    }

    const cascadeIds = getCascadeCompletionIds(currentList, revisionId);
    if (cascadeIds.length === 0) return;

    const previousList = currentList;
    const nowIso = new Date().toISOString();
    const cascadeIdSet = new Set(cascadeIds);

    const optimisticList = currentList.map((r) =>
      cascadeIdSet.has(r.id)
        ? { ...r, completed: true, completed_at: nowIso }
        : r
    );

    setRevisionsMap((prev) => {
      const next = new Map(prev);
      next.set(chapterId, optimisticList);
      return next;
    });

    const { error } = await supabase
      .from("chapter_revisions")
      .update({
        completed: true,
        completed_at: nowIso,
      })
      .in("id", cascadeIds)
      .eq("user_id", userId);

    if (error) {
      console.error("chapter_revisions update error:", error);
      toast.error("Failed to update revision");
      setRevisionsMap((prev) => {
        const next = new Map(prev);
        next.set(chapterId, previousList);
        return next;
      });
    }
  }

  if (!showSections) {
    return (
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            progress={progressMap.get(chapter.id) ?? null}
            revisions={revisionsMap.get(chapter.id) ?? []}
            onUpdate={updateProgress}
            onRevisionComplete={completeRevision}
          />
        ))}
      </div>
    );
  }

  // Chemistry: grouped by section
  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => {
        const sectionChapters = chapters.filter((c) => c.chemistry_section === section);
        if (sectionChapters.length === 0) return null;

        const completed = sectionChapters.filter((c) => {
          const p = progressMap.get(c.id);
          return (
            p?.theory_completed &&
            p?.module_completed &&
            p?.pyq_completed &&
            p?.practice_completed
          );
        }).length;

        return (
          <div key={section}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-zinc-300">
                {section} Chemistry
              </h3>
              <span className="text-xs text-zinc-500">
                {completed}/{sectionChapters.length} completed
              </span>
              <div
                className={cn(
                  "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                  SECTION_COLORS[section]
                )}
              >
                {section}
              </div>
            </div>
            <div className="space-y-2">
              {sectionChapters.map((chapter) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  progress={progressMap.get(chapter.id) ?? null}
                  revisions={revisionsMap.get(chapter.id) ?? []}
                  onUpdate={updateProgress}
                  onRevisionComplete={completeRevision}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}