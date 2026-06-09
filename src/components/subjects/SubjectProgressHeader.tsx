import { ProgressBar } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import type { SubjectProgress } from "@/types";
import { SUBJECT_COLORS } from "@/config/weights";

interface SubjectProgressHeaderProps {
  progress: SubjectProgress;
}

export function SubjectProgressHeader({ progress }: SubjectProgressHeaderProps) {
  const colors = SUBJECT_COLORS[progress.subject];

  const metrics = [
    { label: "Theory", value: progress.theory_percent, icon: "📖" },
    { label: "Module", value: progress.module_percent, icon: "📝" },
    { label: "Practice", value: progress.practice_percent, icon: "✏️" },
    { label: "PYQ", value: progress.pyq_percent, icon: "📄" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">{progress.subject}</h2>
          <p className="text-sm text-zinc-500">
            {progress.completed_chapters} of {progress.total_chapters} chapters fully completed
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-3xl font-bold", colors.text)}>
            {progress.overall_percent}%
          </p>
          <p className="text-xs text-zinc-500">Overall</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <ProgressBar
        value={progress.overall_percent}
        size="lg"
        barClassName={cn("bg-gradient-to-r", colors.gradient)}
        className="mb-5"
      />

      {/* Individual metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-3"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">{metric.label}</span>
              <span className="text-sm">{metric.icon}</span>
            </div>
            <p className="text-lg font-bold text-zinc-100 mb-1">{metric.value}%</p>
            <ProgressBar
              value={metric.value}
              size="sm"
              barClassName={cn("bg-gradient-to-r", colors.gradient)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
