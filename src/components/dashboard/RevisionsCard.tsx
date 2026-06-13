import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

export interface RevisionDisplayItem {
  id: string;
  subject: string;
  chapterName: string;
  revisionNumber: 1 | 2 | 3 | 4;
  status: "Overdue" | "Due Today";
}

interface RevisionsCardProps {
  items: RevisionDisplayItem[];
  overdueCount: number;
  dueTodayCount: number;
}

const MAX_VISIBLE = 5;

export function RevisionsCard({ items, overdueCount, dueTodayCount }: RevisionsCardProps) {
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const remaining = items.length - visibleItems.length;
  const hasItems = items.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-indigo-400" />
            <CardTitle>Revisions</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {overdueCount > 0 && (
              <Badge variant="danger" className="text-[10px]">
                {overdueCount} overdue
              </Badge>
            )}
            {dueTodayCount > 0 && (
              <Badge variant="warning" className="text-[10px]">
                {dueTodayCount} due today
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full flex-shrink-0",
                    item.status === "Overdue" ? "bg-red-500" : "bg-yellow-500"
                  )}
                />
                <span
                  className={cn(
                    "flex-1 text-xs truncate",
                    item.status === "Overdue" ? "text-red-400" : "text-yellow-400"
                  )}
                >
                  {item.subject} • {item.chapterName} • R{item.revisionNumber}
                </span>
              </div>
            ))}
            {remaining > 0 && (
              <p className="text-[10px] text-zinc-500 pl-3.5">+{remaining} more</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            🎉 You&apos;re caught up! No due or overdue revisions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}