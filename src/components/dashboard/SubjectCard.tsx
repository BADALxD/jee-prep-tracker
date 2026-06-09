"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/Progress";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { SubjectProgress, SubjectName } from "@/types";
import { SUBJECT_COLORS } from "@/config/weights";

interface SubjectCardProps {
  progress: SubjectProgress;
}

const SUBJECT_HREF: Record<SubjectName, string> = {
  Physics: "/subjects/physics",
  Chemistry: "/subjects/chemistry",
  Mathematics: "/subjects/mathematics",
};

const SUBJECT_ICONS: Record<SubjectName, string> = {
  Physics: "⚛️",
  Chemistry: "⚗️",
  Mathematics: "∑",
};

export function SubjectCard({ progress }: SubjectCardProps) {
  const colors = SUBJECT_COLORS[progress.subject];
  const href = SUBJECT_HREF[progress.subject];

  const metrics = [
    { label: "Theory", value: progress.theory_percent },
    { label: "Module", value: progress.module_percent },
    { label: "Practice", value: progress.practice_percent },
    { label: "PYQ", value: progress.pyq_percent },
  ];

  return (
    <Link href={href} className="block group">
      <Card className="transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/70 cursor-pointer">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl text-base",
                  colors.bg
                )}
              >
                <span>{SUBJECT_ICONS[progress.subject]}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {progress.subject}
                </h3>
                <p className="text-xs text-zinc-500">
                  {progress.completed_chapters}/{progress.total_chapters} chapters
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xl font-bold", colors.text)}>
                {progress.overall_percent}%
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors group-hover:translate-x-0.5 duration-200" />
            </div>
          </div>

          {/* Overall progress bar */}
          <ProgressBar
            value={progress.overall_percent}
            size="lg"
            barClassName={cn("bg-gradient-to-r", colors.gradient)}
            className="mb-3"
          />

          {/* Metrics grid */}
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-xs font-semibold text-zinc-200">
                  {metric.value}%
                </p>
                <p className="text-[10px] text-zinc-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
