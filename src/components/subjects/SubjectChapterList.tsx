"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChapterRow } from "@/components/subjects/ChapterRow";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Chapter, ChapterProgress, ChapterRevision, SubjectName, ChemistrySection } from "@/types";
import { ensureRevisionsExist, needsBackfill, deleteRevisions } from "@/lib/revisions";

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

  /**
   * Tracks in-flight revision creation promises so that a theory-uncheck
   * arriving before the insert completes can await it before deleting.
   * Key: chapterId  Value: Promise that resolves when the revision insert settles.
   */
  const pendingRevisionInserts = useRef<Map<string, Promise<void>>>(new Map());

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
    // ── Theory is the gatekeeper — handle it on its own dedicated paths ──
    if (field === "theory_completed") {
      if (value) {
        await handleTheoryOn(chapterId);
      } else {
        await handleTheoryOff(chapterId);
      }
      return;
    }

    // ── Non-theory fields: guard against checking when theory is false ──
    // This is a safety net; ChapterRow already disables the buttons visually.
    const currentProgress = progressMap.get(chapterId);
    if (!currentProgress?.theory_completed) {
      // Silently ignore — theory must be true before other fields can be set.
      return;
    }

    const dbField = toDbField(field);

    // ── Wait for any in-flight progress insert on this chapter to finish ──
    const inflight = pendingInserts.current.get(chapterId);
    if (inflight) {
      await inflight;
    }

    const existing = progressMap.get(chapterId);

    // ── INSERT path (no row yet, or only a temp sentinel) ──
    // Note: in practice this path is unreachable for non-theory fields because
    // theory must have been set first (which creates the row). Kept for safety.
    if (!existing || existing.id.startsWith("__temp__")) {
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
          setProgressMap((prev) => {
            const next = new Map(prev);
            next.delete(chapterId);
            return next;
          });
          return null;
        }
        const realRow = data as ChapterProgress;
        setProgressMap((prev) => new Map(prev).set(chapterId, realRow));
        return realRow;
      });

      pendingInserts.current.set(chapterId, insertPromise);
      return;
    }

    // ── UPDATE path ──
    const updated: ChapterProgress = { ...existing, [dbField]: value };
    setProgressMap((prev) => new Map(prev).set(chapterId, updated));

    const { error } = await supabase
      .from("chapter_progress")
      .update({ [dbField]: value })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) {
      console.error("chapter_progress update error:", error);
      toast.error("Failed to save progress");
      setProgressMap((prev) => new Map(prev).set(chapterId, existing));
    }
    // Unticking Module/PYQ/Mock never creates or deletes revisions.
  }

  /**
   * Theory toggled ON.
   * 1. Optimistic: set theory_completed=true in local state immediately.
   * 2. Persist to DB (insert or update).
   * 3. Create R1/R2/R3 immediately (theory is the only gate).
   */
  async function handleTheoryOn(chapterId: string) {
    // ── Wait for any in-flight progress insert to settle first ──
    const inflight = pendingInserts.current.get(chapterId);
    if (inflight) {
      await inflight;
    }

    const existing = progressMap.get(chapterId);

    // ── Optimistic UI: flip theory on immediately ──
    if (existing) {
      setProgressMap((prev) =>
        new Map(prev).set(chapterId, { ...existing, theory_completed: true })
      );
    } else {
      setProgressMap((prev) =>
        new Map(prev).set(chapterId, makeOptimisticRow(userId, chapterId, "theory_completed", true))
      );
    }

    // ── Persist to DB ──
    let persistedRow: ChapterProgress | null = null;

    if (!existing || existing.id.startsWith("__temp__")) {
      // INSERT
      const insertPromise: Promise<ChapterProgress | null> = Promise.resolve(
        supabase
          .from("chapter_progress")
          .insert({ user_id: userId, chapter_id: chapterId, theory_completed: true })
          .select("id, user_id, chapter_id, theory_completed, module_completed, practice_completed, pyq_completed, created_at, updated_at")
          .single()
      ).then(({ data, error }): ChapterProgress | null => {
        pendingInserts.current.delete(chapterId);
        if (error || !data) {
          toast.error("Failed to save progress");
          // Revert optimistic theory toggle
          setProgressMap((prev) => {
            const next = new Map(prev);
            if (existing) {
              next.set(chapterId, existing);
            } else {
              next.delete(chapterId);
            }
            return next;
          });
          return null;
        }
        const realRow = data as ChapterProgress;
        setProgressMap((prev) => new Map(prev).set(chapterId, realRow));
        return realRow;
      });

      pendingInserts.current.set(chapterId, insertPromise);
      persistedRow = await insertPromise;
    } else {
      // UPDATE
      const { error } = await supabase
        .from("chapter_progress")
        .update({ theory_completed: true })
        .eq("id", existing.id)
        .eq("user_id", userId);

      if (error) {
        console.error("chapter_progress update error:", error);
        toast.error("Failed to save progress");
        // Revert
        setProgressMap((prev) => new Map(prev).set(chapterId, existing));
        return;
      }
      persistedRow = { ...existing, theory_completed: true };
    }

    if (!persistedRow) return; // insert failed; already reverted

    // ── Create revisions immediately (theory is the only gate) ──
    // If a revision insert is somehow still in-flight from a prior cycle, await it first.
    const inflightRevisions = pendingRevisionInserts.current.get(chapterId);
    if (inflightRevisions) {
      await inflightRevisions;
    }

    const existingRevisions = revisionsMap.get(chapterId);
    if (!existingRevisions || existingRevisions.length === 0) {
      const revisionPromise: Promise<void> = ensureRevisionsExist(
        supabase,
        userId,
        chapterId,
        existingRevisions
      ).then((created) => {
        pendingRevisionInserts.current.delete(chapterId);
        if (created.length > 0) {
          setRevisionsMap((prev) => {
            const next = new Map(prev);
            next.set(chapterId, created);
            return next;
          });
        }
      });

      pendingRevisionInserts.current.set(chapterId, revisionPromise);
    }
  }

  /**
   * Theory toggled OFF.
   * 1. Optimistic: immediately zero out all four fields in local state
   *    and clear revision rows — so buttons lock and badges disappear instantly.
   * 2. Await any in-flight revision insert to prevent orphaned rows.
   * 3. Delete revision rows from DB.
   * 4. Persist zeroed progress columns to DB in a single UPDATE.
   * Rollback on any failure.
   */
  async function handleTheoryOff(chapterId: string) {
    // ── Wait for any in-flight progress insert to settle first ──
    const inflight = pendingInserts.current.get(chapterId);
    if (inflight) {
      await inflight;
    }

    const existing = progressMap.get(chapterId);

    // Nothing to do if there's no row at all
    if (!existing) return;

    const previousRevisions = revisionsMap.get(chapterId) ?? [];

    // ── Optimistic UI: zero all fields and hide revisions instantly ──
    const zeroed: ChapterProgress = {
      ...existing,
      theory_completed: false,
      module_completed: false,
      pyq_completed: false,
      practice_completed: false,
    };
    setProgressMap((prev) => new Map(prev).set(chapterId, zeroed));
    setRevisionsMap((prev) => {
      const next = new Map(prev);
      next.delete(chapterId); // hides R1/R2/R3 immediately
      return next;
    });

    // ── Await any in-flight revision insert before deleting ──
    // (Race: user checks theory then immediately unchecks — the insert may
    //  still be in flight; we must let it land before we delete.)
    const inflightRevisions = pendingRevisionInserts.current.get(chapterId);
    if (inflightRevisions) {
      await inflightRevisions;
    }

    // ── Delete revision rows from DB ──
    const deleteOk = await deleteRevisions(supabase, userId, chapterId);
    if (!deleteOk) {
      toast.error("Failed to remove revisions");
      // Restore revision state (progress will still be rolled back below if update also fails,
      // but a partial failure here means we keep going to still try the progress update)
    }

    // ── Persist zeroed progress to DB — single UPDATE for all four columns ──
    if (existing.id.startsWith("__temp__")) {
      // Row was never really in DB; nothing to update.
      return;
    }

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
      // Full rollback: restore prior progress and revisions
      setProgressMap((prev) => new Map(prev).set(chapterId, existing));
      if (previousRevisions.length > 0) {
        setRevisionsMap((prev) => {
          const next = new Map(prev);
          next.set(chapterId, previousRevisions);
          return next;
        });
      }
    }
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