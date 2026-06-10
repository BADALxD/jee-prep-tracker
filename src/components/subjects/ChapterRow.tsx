"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import type { Chapter, ChapterProgress } from "@/types";
import { PROGRESS_WEIGHTS } from "@/config/weights";
import { Check } from "lucide-react";

interface ChapterRowProps {
  chapter: Chapter;
  progress: ChapterProgress | null;
  onUpdate: (
    chapterId: string,
    field: "theory_completed" | "module_completed" | "pyq_completed" | "mock_completed",
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

/**
 * Calculates weighted completion for display.
 * Theory=25%, Module=45%, PYQ=20%, Mock=10%
 * DB: mock is stored in practice_completed column
 */
function getCompletionPercent(progress: ChapterProgress | null): number {
  if (!progress) return 0;
  const score =
    (progress.theory_completed ? PROGRESS_WEIGHTS.theory : 0) +
    (progress.module_completed ? PROGRESS_WEIGHTS.module : 0) +
    (progress.pyq_completed ? PROGRESS_WEIGHTS.pyq : 0) +
    (progress.practice_completed ? PROGRESS_WEIGHTS.mock : 0); // practice_completed = mock
  return Math.round(score * 100);
}

interface ProgressToggleProps {
  label: string;
  weight: string;
  checked: boolean;
  color: string;
  onChange: () => void;
}

function ProgressToggle({ label, weight, checked, color, onChange }: ProgressToggleProps) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 select-none",
        checked
          ? `${color} border-transparent shadow-sm`
          : "bg-zinc-900/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-full border flex-shrink-0 transition-colors",
          checked ? "border-current bg-current/20" : "border-current/40"
        )}
      >
        {checked && <Check className="h-2 w-2" strokeWidth={3} />}
      </span>
      <span>{label}</span>
      <span className={cn("opacity-60 text-[10px]", checked ? "" : "text-zinc-600")}>
        {weight}
      </span>
    </button>
  );
}

export function ChapterRow({ chapter, progress, onUpdate }: ChapterRowProps) {
  const completion = getCompletionPercent(progress);
  const difficulty = DIFFICULTY_LABELS[chapter.difficulty_weight] || DIFFICULTY_LABELS[3];

  const fields: Array<{
    key: "theory_completed" | "module_completed" | "pyq_completed" | "mock_completed";
    label: string;
    weight: string;
    checkedValue: boolean;
    color: string;
  }> = [
    {
      key: "theory_completed",
      label: "Theory",
      weight: "25%",
      checkedValue: progress?.theory_completed ?? false,
      color: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
    },
    {
      key: "module_completed",
      label: "Module",
      weight: "45%",
      checkedValue: progress?.module_completed ?? false,
      color: "bg-violet-500/20 border-violet-500/40 text-violet-300",
    },
    {
      key: "pyq_completed",
      label: "PYQ",
      weight: "20%",
      checkedValue: progress?.pyq_completed ?? false,
      color: "bg-amber-500/20 border-amber-500/40 text-amber-300",
    },
    {
      key: "mock_completed",
      label: "Mock",
      weight: "10%",
      // mock_completed maps to practice_completed in DB
      checkedValue: progress?.practice_completed ?? false,
      color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    },
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
                : completion >= 70
                ? "bg-blue-500"
                : completion >= 25
                ? "bg-indigo-500"
                : "bg-zinc-600"
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
                : completion >= 70
                ? "text-blue-400"
                : completion >= 25
                ? "text-indigo-400"
                : "text-zinc-500"
            )}
          >
            {completion}%
          </span>
        </div>
      </div>

      {/* Toggle buttons for each progress component */}
      <div className="mt-3 flex flex-wrap gap-2">
        {fields.map((field) => (
          <ProgressToggle
            key={field.key}
            label={field.label}
            weight={field.weight}
            checked={field.checkedValue}
            color={field.color}
            // Read the current value from `field.checkedValue` at call time (it
            // is re-derived from `progress` on every render, so it is always fresh).
            onChange={() => onUpdate(chapter.id, field.key, !field.checkedValue)}
          />
        ))}
      </div>
    </div>
  );
}
