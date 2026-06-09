import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
    secondary: "bg-zinc-800 text-zinc-300 border border-zinc-700/50",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    danger: "bg-red-500/15 text-red-400 border border-red-500/20",
    info: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    outline: "border border-zinc-700 text-zinc-400 bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
