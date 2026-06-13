import type { ChapterProgress, ChapterRevision, RevisionStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const REVISION_OFFSETS_DAYS: Record<1 | 2 | 3 | 4, number> = {
  1: 1,
  2: 7,
  3: 30,
  4: 90,
};

export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildRevisionRows(
  userId: string,
  chapterId: string,
  baseDate: Date = new Date()
): Array<{
  user_id: string;
  chapter_id: string;
  revision_number: 1 | 2 | 3 | 4;
  due_date: string;
  completed: boolean;
}> {
  return ([1, 2, 3, 4] as const).map((revisionNumber) => {
    const due = new Date(baseDate);
    due.setDate(due.getDate() + REVISION_OFFSETS_DAYS[revisionNumber]);
    return {
      user_id: userId,
      chapter_id: chapterId,
      revision_number: revisionNumber,
      due_date: toDateOnlyString(due),
      completed: false,
    };
  });
}

export function getRevisionStatus(revision: ChapterRevision): RevisionStatus {
  if (revision.completed) return "Completed";

  const today = toDateOnlyString(new Date());

  if (revision.due_date === today) return "Due Today";
  if (revision.due_date < today) return "Overdue";
  return "Upcoming";
}

/**
 * A revision can be completed only once its due date has arrived
 * (due_date <= today). "Upcoming" revisions are locked.
 * Already-completed revisions are NOT "completable" again — this function
 * answers "is it allowed to transition to completed right now", which is
 * false once it's already completed (permanence is enforced by the caller
 * treating completed as a terminal state, not by this function).
 */
export function canCompleteRevision(revision: ChapterRevision): boolean {
  if (revision.completed) return false;
  const today = toDateOnlyString(new Date());
  return revision.due_date <= today;
}

export async function ensureRevisionsExist(
  supabase: SupabaseClient,
  userId: string,
  chapterId: string,
  existingRevisions: ChapterRevision[] | undefined,
  baseDate: Date = new Date()
): Promise<ChapterRevision[]> {
  if (existingRevisions && existingRevisions.length > 0) {
    return [];
  }

  const rows = buildRevisionRows(userId, chapterId, baseDate);

  const { data, error } = await supabase
    .from("chapter_revisions")
    .insert(rows)
    .select("*");

  if (error) {
    if ((error as { code?: string }).code !== "23505") {
      console.error("chapter_revisions insert error:", error);
    }
    return [];
  }

  return (data ?? []) as ChapterRevision[];
}

/**
 * Theory is the gatekeeper for revisions.
 * Backfill is needed whenever theory is completed but no revision rows exist yet —
 * regardless of whether Module/PYQ/Mock are done.
 */
export function needsBackfill(
  progress: ChapterProgress | null | undefined,
  existingRevisions: ChapterRevision[] | undefined
): boolean {
  return (
    Boolean(progress?.theory_completed) &&
    (!existingRevisions || existingRevisions.length === 0)
  );
}

/**
 * Deletes all chapter_revisions rows for a given chapter belonging to the user.
 * Called when theory is unchecked — revisions must not exist without theory.
 * Requires a DELETE RLS policy on chapter_revisions (auth.uid() = user_id).
 * Returns true on success, false on error.
 */
export async function deleteRevisions(
  supabase: SupabaseClient,
  userId: string,
  chapterId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("chapter_revisions")
    .delete()
    .eq("chapter_id", chapterId)
    .eq("user_id", userId);

  if (error) {
    console.error("chapter_revisions delete error:", error);
    return false;
  }
  return true;
}

/**
 * Given the full set of revisions for a chapter and the revision being
 * completed (target), returns the list of revision IDs that must be marked
 * completed as part of this action:
 *  - the target itself
 *  - all revisions with revision_number < target.revision_number that are
 *    currently NOT completed (cascade backward only — no forward cascade,
 *    no dependency locks on the target itself beyond its own due date).
 *
 * Already-completed revisions (including the target, if somehow already
 * completed) are excluded — their completed_at must not be overwritten.
 *
 * Returns an empty array if the target is not completable
 * (use canCompleteRevision to check that before calling this).
 */
export function getCascadeCompletionIds(
  revisions: ChapterRevision[],
  targetRevisionId: string
): string[] {
  const target = revisions.find((r) => r.id === targetRevisionId);
  if (!target) return [];
  if (!canCompleteRevision(target)) return [];

  return revisions
    .filter(
      (r) =>
        !r.completed &&
        (r.id === targetRevisionId || r.revision_number < target.revision_number)
    )
    .map((r) => r.id);
}
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  return `${day}/${month}/${year}`;
}