import type { ChapterProgress, ChapterRevision, RevisionStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const REVISION_OFFSETS_DAYS: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 7,
  3: 30,
};

export function isFullyCompleted(progress: Partial<ChapterProgress> | null | undefined): boolean {
  if (!progress) return false;
  return Boolean(
    progress.theory_completed &&
      progress.module_completed &&
      progress.pyq_completed &&
      progress.practice_completed
  );
}

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
  revision_number: 1 | 2 | 3;
  due_date: string;
  completed: boolean;
}> {
  return ([1, 2, 3] as const).map((revisionNumber) => {
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

export function needsBackfill(
  progress: ChapterProgress | null | undefined,
  existingRevisions: ChapterRevision[] | undefined
): boolean {
  return isFullyCompleted(progress) && (!existingRevisions || existingRevisions.length === 0);
}