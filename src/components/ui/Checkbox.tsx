"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, onChange, ...props }, ref) => {
    return (
      <label className={cn("flex items-start gap-3 cursor-pointer group", className)}>
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-4 w-4 rounded border transition-all duration-200",
              checked
                ? "bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-500/30"
                : "bg-zinc-900 border-zinc-600 group-hover:border-zinc-500"
            )}
          >
            {checked && (
              <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" strokeWidth={3} />
            )}
          </div>
        </div>
        {(label || description) && (
          <div>
            {label && (
              <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
