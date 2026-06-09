"use client";

import { ProgressRing } from "@/components/ui/Progress";
import { getReadinessLevel } from "@/config/weights";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ReadinessMeterProps {
  score: number;
  physicsScore?: number;
  chemistryScore?: number;
  mathScore?: number;
}

export function ReadinessMeter({
  score,
  physicsScore = 0,
  chemistryScore = 0,
  mathScore = 0,
}: ReadinessMeterProps) {
  const level = getReadinessLevel(score);

  return (
    <div className="space-y-4">
      {/* Main readiness ring */}
      <div className="flex flex-col items-center gap-3">
        <ProgressRing
          value={score}
          size={140}
          strokeWidth={10}
          color={level.color}
          trackColor={`${level.color}18`}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-100">{score}</p>
            <p className="text-xs text-zinc-500">/ 100</p>
          </div>
        </ProgressRing>

        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
            level.bg,
            level.text,
            level.border
          )}
        >
          <Sparkles className="h-3 w-3" />
          {level.level}
        </div>
      </div>

      {/* Subject breakdown */}
      <div className="space-y-2.5">
        <SubjectMini label="Physics" value={physicsScore} color="#6366f1" />
        <SubjectMini label="Chemistry" value={chemistryScore} color="#10b981" />
        <SubjectMini label="Mathematics" value={mathScore} color="#f59e0b" />
      </div>

      {/* Levels legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { range: "0-25", label: "Beginner", color: "bg-red-500" },
          { range: "26-50", label: "Intermediate", color: "bg-amber-500" },
          { range: "51-75", label: "Advanced", color: "bg-blue-500" },
          { range: "76-100", label: "Exam Ready", color: "bg-emerald-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", item.color)} />
            <span className="text-xs text-zinc-500">
              {item.range} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectMini({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-zinc-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
      <span className="w-9 text-right text-xs font-medium text-zinc-400">
        {value}%
      </span>
    </div>
  );
}
