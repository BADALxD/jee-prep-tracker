"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import type { Chapter, ChapterProgress, ChapterRevision, RevisionStatus } from "@/types";
import { PROGRESS_WEIGHTS } from "@/config/weights";
import {
  getRevisionStatus,
  canCompleteRevision,
  formatDueDate,
} from "@/lib/revisions";
import { Check, Lock } from "lucide-react";

interface ChapterRowProps {
  chapter: Chapter;
  progress: ChapterProgress | null;
  revisions: ChapterRevision[];
  onUpdate: (
    chapterId: string,
    field: "theory_completed" | "module_completed" | "pyq_completed" | "mock_completed",
    value: boolean
  ) => void;
  onRevisionComplete: (chapterId: string, revisionId: string) => void;
  onManualRevision: (chapterId: string) => void;
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
  /**
   * When true the button is rendered but non-interactive.
   * Used for Module/PYQ/Mock when Theory is not yet checked.
   */
  disabled?: boolean;
}

function ProgressToggle({ label, weight, checked, color, onChange, disabled = false }: ProgressToggleProps) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      title={disabled ? "Complete Theory first" : undefined}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 select-none",
        disabled
          ? "opacity-35 cursor-not-allowed bg-zinc-900/40 border-zinc-800/60 text-zinc-600"
          : checked
          ? `${color} border-transparent shadow-sm`
          : "bg-zinc-900/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-full border flex-shrink-0 transition-colors",
          disabled
            ? "border-zinc-700/40"
            : checked
            ? "border-current bg-current/20"
            : "border-current/40"
        )}
      >
        {checked && !disabled && <Check className="h-2 w-2" strokeWidth={3} />}
      </span>
      <span>{label}</span>
      <span className={cn("opacity-60 text-[10px]", checked && !disabled ? "" : "text-zinc-600")}>
        {weight}
      </span>
    </button>
  );
}

const REVISION_STATUS_CLASSES: Record<RevisionStatus, string> = {
  Completed: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  "Due Today": "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
  Overdue: "bg-red-500/20 border-red-500/40 text-red-300",
  Upcoming: "bg-zinc-800/60 border-zinc-700/60 text-zinc-400",
};

/**
 * Compact colored badge for a single revision (R1-R4).
 *
 * Behavior:
 * - Completed -> green, permanent, click does nothing (not a toggle).
 * - Due Today / Overdue (not completed) -> yellow/red, clickable to complete.
 *   Completing may cascade-complete earlier revisions.
 * - Upcoming (not completed, due_date in future) -> gray + lock icon,
 *   click does nothing (locked until due date arrives).
 */
function RevisionBadge({
  revision,
  onComplete,
}: {
  revision: ChapterRevision;
  onComplete: () => void;
}) {
  const status = getRevisionStatus(revision);
  const completable = canCompleteRevision(revision);
  const isLocked = !revision.completed && !completable;

  const handleClick = () => {
    if (revision.completed) return; // permanent — no reverse toggle
    if (!completable) return; // locked — due date not yet reached
    onComplete();
  };

  return (
    <button
      onClick={handleClick}
      title={
        revision.completed
          ? `Revision ${revision.revision_number} — completed`
          : isLocked
          ? `Revision ${revision.revision_number} — locked until ${formatDueDate(revision.due_date)}`
          : `Revision ${revision.revision_number} — due ${formatDueDate(revision.due_date)} — ${status} — click to complete`
      }
      className={cn(
        "inline-flex items-center justify-center gap-0.5 h-6 min-w-[2rem] px-1.5 rounded-md border text-[10px] font-semibold transition-all duration-150 select-none",
        REVISION_STATUS_CLASSES[status],
        revision.completed
          ? "cursor-default"
          : isLocked
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:brightness-110"
      )}
    >
      {isLocked && <Lock className="h-2.5 w-2.5" strokeWidth={3} />}
      R{revision.revision_number}
    </button>
  );
}

export function ChapterRow({ chapter, progress, revisions, onUpdate, onRevisionComplete, onManualRevision,}: ChapterRowProps) {
  const completion = getCompletionPercent(progress);
  const difficulty = DIFFICULTY_LABELS[chapter.difficulty_weight] || DIFFICULTY_LABELS[3];

  const sortedRevisions = [...revisions].sort((a, b) => a.revision_number - b.revision_number);

  // Theory must be true before Module/PYQ/Mock become interactive.
  const theoryChecked = progress?.theory_completed ?? false;
  const lastRevisionDate = progress?.last_revision_date;
  

  const fields: Array<{
    key: "theory_completed" | "module_completed" | "pyq_completed" | "mock_completed";
    label: string;
    weight: string;
    checkedValue: boolean;
    color: string;
    disabled: boolean;
  }> = [
    {
      key: "theory_completed",
      label: "Theory",
      weight: "25%",
      checkedValue: progress?.theory_completed ?? false,
      color: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
      disabled: false, // Theory is always interactive
    },
    {
      key: "module_completed",
      label: "Module",
      weight: "45%",
      checkedValue: progress?.module_completed ?? false,
      color: "bg-violet-500/20 border-violet-500/40 text-violet-300",
      disabled: !theoryChecked,
    },
    {
      key: "pyq_completed",
      label: "PYQ",
      weight: "20%",
      checkedValue: progress?.pyq_completed ?? false,
      color: "bg-amber-500/20 border-amber-500/40 text-amber-300",
      disabled: !theoryChecked,
    },
    {
      key: "mock_completed",
      label: "Mock",
      weight: "10%",
      // mock_completed maps to practice_completed in DB
      checkedValue: progress?.practice_completed ?? false,
      color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
      disabled: !theoryChecked,
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

            {/* Revision badges (R1-R4) — shown whenever revision rows exist,
                even if chapter is later unchecked (history persists). */}
            {sortedRevisions.length > 0 && (
              <div className="flex items-center gap-1 ml-1">
                {sortedRevisions.map((rev) => (
                  <RevisionBadge
                    key={rev.id}
                    revision={rev}
                    onComplete={() => onRevisionComplete(chapter.id, rev.id)}
                  />
                ))}
                <button
  onClick={() => onManualRevision(chapter.id)}
  title="Mark that you've revised this chapter today"
  className="inline-flex items-center justify-center h-6 min-w-[2rem] px-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-semibold hover:bg-cyan-500/20 transition-all"
>
  ↻
  {lastRevisionDate && (
  <span className="text-[10px] text-zinc-500 ml-1">
    Last revised: {new Date(lastRevisionDate).toLocaleDateString("en-IN")}
  </span>
)}
</button>
              </div>
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
            disabled={field.disabled}
            // Read the current value from `field.checkedValue` at call time (it
            // is re-derived from `progress` on every render, so it is always fresh).
            onChange={() => onUpdate(chapter.id, field.key, !field.checkedValue)}
          />
        ))}
      </div>
    </div>
  );
}