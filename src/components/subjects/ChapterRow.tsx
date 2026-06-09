"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import type { Chapter, ChapterProgress } from "@/types";

interface ChapterRowProps {
  chapter: Chapter;
  progress: ChapterProgress | null;
  onUpdate: (
    chapterId: string,
    field: "theory_completed" | "module_completed" | "practice_completed" | "pyq_completed",
    value: boolean
  ) => void;
}

const DIFFICULTY_LABELS: Record<number, { label: string; class: string }> = {
  1: { label: "Easy", class: "success" },
  2: { label: "Easy+", class: "success" },
  3: { label: "Medium", class: "warning" },
  4: { label: "Hard", class: "danger" },
  5: { label: "Very Hard", class: "danger" },
};

function getCompletionPercent(progress: ChapterProgress | null): number {
  if (!progress) return 0;
  const checks = [
    progress.theory_completed,
    progress.module_completed,
    progress.practice_completed,
    progress.pyq_completed,
  ];
  return Math.round((checks.filter(Boolean).length / 4) * 100);
}

export function ChapterRow({ chapter, progress, onUpdate }: ChapterRowProps) {
  const completion = getCompletionPercent(progress);
  const difficulty = DIFFICULTY_LABELS[chapter.difficulty_weight] || DIFFICULTY_LABELS[3];

  const fields: Array<{
    key: "theory_completed" | "module_completed" | "practice_completed" | "pyq_completed";
    label: string;
  }> = [
    { key: "theory_completed", label: "Theory" },
    { key: "module_completed", label: "Module" },
    { key: "practice_completed", label: "Practice" },
    { key: "pyq_completed", label: "PYQ" },
  ];

  return (
    <div
      className={cn(
        "group rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 transition-all duration-200 hover:border-zinc-700/60 hover:bg-zinc-900/50",
        completion === 100 && "border-emerald-500/20 bg-emerald-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Chapter info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs text-zinc-600 font-mono">
              {String(chapter.chapter_number).padStart(2, "0")}
            </span>
            <h3
              className={cn(
                "text-sm font-medium",
                completion === 100 ? "text-emerald-400" : "text-zinc-200"
              )}
            >
              {chapter.name}
            </h3>
            <Badge variant={difficulty.class as "success" | "warning" | "danger"}>
              {difficulty.label}
            </Badge>
            {chapter.importance_score >= 12 && (
              <Badge variant="default">High Priority</Badge>
            )}
          </div>

          {/* Progress bar */}
          <ProgressBar
            value={completion}
            size="sm"
            barClassName={
              completion === 100
                ? "bg-emerald-500"
                : completion >= 50
                ? "bg-blue-500"
                : "bg-indigo-500"
            }
            className="max-w-xs"
          />
        </div>

        {/* Right: Completion percentage */}
        <div className="text-right flex-shrink-0">
          <span
            className={cn(
              "text-sm font-bold",
              completion === 100
                ? "text-emerald-400"
                : completion >= 50
                ? "text-blue-400"
                : "text-zinc-400"
            )}
          >
            {completion}%
          </span>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="mt-3 flex flex-wrap gap-4">
        {fields.map((field) => (
          <Checkbox
            key={field.key}
            label={field.label}
            checked={progress?.[field.key] ?? false}
            onChange={(e) => onUpdate(chapter.id, field.key, e.target.checked)}
          />
        ))}
      </div>
    </div>
  );
}
