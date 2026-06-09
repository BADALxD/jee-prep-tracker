"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChapterRow } from "@/components/subjects/ChapterRow";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Chapter, ChapterProgress, SubjectName, ChemistrySection } from "@/types";

interface SubjectChapterListProps {
  subject: SubjectName;
  chapters: Chapter[];
  initialProgressData: ChapterProgress[];
  userId: string;
  showSections?: boolean;
}

const SECTIONS: ChemistrySection[] = ["Physical", "Inorganic", "Organic"];

export function SubjectChapterList({
  chapters,
  initialProgressData,
  userId,
  showSections = false,
}: SubjectChapterListProps) {
  const [progressMap, setProgressMap] = useState<Map<string, ChapterProgress>>(() => {
    const m = new Map<string, ChapterProgress>();
    initialProgressData.forEach((p) => m.set(p.chapter_id, p));
    return m;
  });

  const supabase = createClient();

  async function updateProgress(
    chapterId: string,
    field: "theory_completed" | "module_completed" | "practice_completed" | "pyq_completed",
    value: boolean
  ) {
    const existing = progressMap.get(chapterId);

    // Optimistic update
    const updated = existing
      ? { ...existing, [field]: value }
      : {
          id: `temp-${chapterId}`,
          user_id: userId,
          chapter_id: chapterId,
          theory_completed: false,
          module_completed: false,
          practice_completed: false,
          pyq_completed: false,
          revision_count: 0,
          last_revision_date: null,
          confidence_score: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          [field]: value,
        };

    const newMap = new Map(progressMap);
    newMap.set(chapterId, updated as ChapterProgress);
    setProgressMap(newMap);

    if (existing) {
      const { error } = await supabase
        .from("chapter_progress")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) {
        toast.error("Failed to save");
        const revert = new Map(progressMap);
        setProgressMap(revert);
      }
    } else {
      const { data, error } = await supabase
        .from("chapter_progress")
        .insert({ user_id: userId, chapter_id: chapterId, [field]: value })
        .select()
        .single();
      if (error) {
        toast.error("Failed to save");
        const revert = new Map(progressMap);
        setProgressMap(revert);
      } else if (data) {
        const finalMap = new Map(progressMap);
        finalMap.set(chapterId, data as ChapterProgress);
        setProgressMap(finalMap);
      }
    }
  }

  if (!showSections) {
    return (
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            progress={progressMap.get(chapter.id) || null}
            onUpdate={updateProgress}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => {
        const sectionChapters = chapters.filter((c) => c.chemistry_section === section);
        if (sectionChapters.length === 0) return null;

        const completed = sectionChapters.filter((c) => {
          const p = progressMap.get(c.id);
          return p?.theory_completed && p?.module_completed && p?.practice_completed && p?.pyq_completed;
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
              <div className={cn(
                "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                section === "Physical" ? "bg-blue-500/10 text-blue-400" :
                section === "Inorganic" ? "bg-emerald-500/10 text-emerald-400" :
                "bg-amber-500/10 text-amber-400"
              )}>
                {section}
              </div>
            </div>
            <div className="space-y-2">
              {sectionChapters.map((chapter) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  progress={progressMap.get(chapter.id) || null}
                  onUpdate={updateProgress}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
