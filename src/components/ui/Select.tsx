"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "w-full appearance-none rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-3 py-2.5 pr-10 text-sm text-zinc-100 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500/50",
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-zinc-900">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
