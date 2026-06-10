"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateSubjectProgress,
  calculateOverallProgress,
} from "@/lib/progress";
import type { Chapter, ChapterProgress, OverallProgress, SubjectName } from "@/types";

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    async function fetchProgress() {
      setIsLoading(true);
      const supabase = createClient();

      const [{ data: chapters, error: chErr }, { data: progressData, error: prErr }] =
        await Promise.all([
          supabase.from("chapters").select("*").order("chapter_number"),
          supabase
            .from("chapter_progress")
            .select("*, chapter:chapters(*)")
            .eq("user_id", userId),
        ]);

      if (chErr || prErr) {
        setError(chErr?.message || prErr?.message || "Failed to load progress");
        setIsLoading(false);
        return;
      }

      const progressMap = new Map<string, ChapterProgress>();
      (progressData || []).forEach((p: ChapterProgress) => {
        progressMap.set(p.chapter_id, p);
      });

      const physicsChapters = (chapters || []).filter((c: Chapter) => c.subject === "Physics");
      const chemistryChapters = (chapters || []).filter((c: Chapter) => c.subject === "Chemistry");
      const mathChapters = (chapters || []).filter((c: Chapter) => c.subject === "Mathematics");

      const physicsProgress = calculateSubjectProgress("Physics", physicsChapters, progressMap);
      const chemistryProgress = calculateSubjectProgress("Chemistry", chemistryChapters, progressMap);
      const mathProgress = calculateSubjectProgress("Mathematics", mathChapters, progressMap);

      const overallProgress = calculateOverallProgress(physicsProgress, chemistryProgress, mathProgress);

      setProgress(overallProgress);
      setIsLoading(false);
    }

    fetchProgress();
  }, [userId]);

  return { progress, isLoading, error };
}

export function useSubjectChapters(subject: SubjectName, userId: string | undefined) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, ChapterProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  async function fetchData() {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const [{ data: chapterData }, { data: progressData }] = await Promise.all([
      supabase
        .from("chapters")
        .select("*")
        .eq("subject", subject)
        .order("chapter_number"),
      supabase
        .from("chapter_progress")
        .select("*")
        .eq("user_id", userId),
    ]);

    setChapters(chapterData || []);

    const map = new Map<string, ChapterProgress>();
    (progressData || []).forEach((p: ChapterProgress) => {
      map.set(p.chapter_id, p);
    });
    setProgressMap(map);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, userId]);

  /**
   * Update a progress field. "mock_completed" maps to "practice_completed" in DB.
   */
  async function updateProgress(
    chapterId: string,
    field: "theory_completed" | "module_completed" | "pyq_completed" | "mock_completed",
    value: boolean
  ) {
    if (!userId) return;

    const dbField = field === "mock_completed" ? "practice_completed" : field;
    const existing = progressMap.get(chapterId);

    if (existing) {
      const { data, error } = await supabase
        .from("chapter_progress")
        .update({ [dbField]: value, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (!error && data) {
        const newMap = new Map(progressMap);
        newMap.set(chapterId, data as ChapterProgress);
        setProgressMap(newMap);
      }
    } else {
      const { data, error } = await supabase
        .from("chapter_progress")
        .insert({
          user_id: userId,
          chapter_id: chapterId,
          [dbField]: value,
        })
        .select()
        .single();

      if (!error && data) {
        const newMap = new Map(progressMap);
        newMap.set(chapterId, data as ChapterProgress);
        setProgressMap(newMap);
      }
    }
  }

  return { chapters, progressMap, isLoading, updateProgress, refetch: fetchData };
}
