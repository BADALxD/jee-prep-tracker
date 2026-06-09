import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateSubjectProgress } from "@/lib/progress";
import { SubjectProgressHeader } from "@/components/subjects/SubjectProgressHeader";
import { SubjectChapterList } from "@/components/subjects/SubjectChapterList";
import type { Chapter, ChapterProgress } from "@/types";

export const metadata = { title: "Chemistry — JEE Tracker" };

export default async function ChemistryPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth/login");

  const [{ data: chapters }, { data: progressData }] = await Promise.all([
    supabase.from("chapters").select("*").eq("subject", "Chemistry").order("chapter_number"),
    supabase.from("chapter_progress").select("*").eq("user_id", authUser.id),
  ]);

  const progressMap = new Map<string, ChapterProgress>();
  (progressData || []).forEach((p: ChapterProgress) => progressMap.set(p.chapter_id, p));

  const progress = calculateSubjectProgress("Chemistry", chapters || [], progressMap);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-4xl mx-auto">
      <SubjectProgressHeader progress={progress} />
      <SubjectChapterList
        subject="Chemistry"
        chapters={chapters || []}
        initialProgressData={progressData || []}
        userId={authUser.id}
        showSections
      />
    </div>
  );
}
