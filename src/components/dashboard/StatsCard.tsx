import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-indigo-500/10",
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("transition-all duration-200 hover:border-zinc-700/80", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-zinc-100 truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs mt-1",
                  trend.positive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
              iconBg
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
