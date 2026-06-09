"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProgressBar({
  value,
  className,
  barClassName,
  showLabel = false,
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heights = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2.5",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-end">
          <span className="text-xs text-zinc-400">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-zinc-800/60",
          heights[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            animated && "animate-progress-fill",
            barClassName
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

// Radial/Ring progress
interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  color = "#6366f1",
  trackColor = "rgba(99, 102, 241, 0.1)",
  children,
}: ProgressRingProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
