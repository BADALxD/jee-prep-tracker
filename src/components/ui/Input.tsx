"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, type, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              error && "border-red-500/50 focus:ring-red-500/30",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
