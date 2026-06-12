"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChapterRow } from "@/components/subjects/ChapterRow";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Chapter, ChapterProgress, ChapterRevision, SubjectName, ChemistrySection } from "@/types";
import { isFullyCompleted, ensureRevisionsExist, needsBackfill } from "@/lib/revisions";

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

  // ── Backfill: on first mount, generate revisions for chapters that were
  // already fully completed before this feature shipped and have no
  // revision rows yet. Best-effort — failures are silent (non-blocking). ──
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

          // ── Revision creation check (insert path) ──
          maybeCreateRevisions(chapterId, realRow);

          return realRow;
        });

      pendingInserts.current.set(chapterId, insertPromise);
      return;
    }

    // ── UPDATE path (real row exists, id is a genuine UUID) ──
    // Optimistic update first
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

    // ── Revision creation check (update path) ──
    maybeCreateRevisions(chapterId, updated);
  }

  /**
   * If the merged progress row is now fully completed AND no revision rows
   * exist yet for this chapter, create them (anchored to "now").
   * No-op if revisions already exist (revision history persists even after
   * later unchecking the chapter).
   * Best-effort: failures here do not affect progress state / UI.
   */
  function maybeCreateRevisions(chapterId: string, mergedProgress: ChapterProgress) {
    if (!isFullyCompleted(mergedProgress)) return;

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
   * Marks a single revision as complete/incomplete. Reversible.
   * Optimistic update with rollback on failure.
   */
  async function updateRevision(chapterId: string, revisionId: string, completed: boolean) {
    const currentList = revisionsMap.get(chapterId) ?? [];
    const previousList = currentList;

    const optimisticList = currentList.map((r) =>
      r.id === revisionId
        ? { ...r, completed, completed_at: completed ? new Date().toISOString() : null }
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
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", revisionId)
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
            onRevisionUpdate={updateRevision}
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
                  onRevisionUpdate={updateRevision}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}