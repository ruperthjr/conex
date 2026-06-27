"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message – when set, the input gets a red border and helper text */
  error?: string;
  /** Left icon element (e.g., <Mail />) */
  leftIcon?: React.ReactNode;
  /** Right icon element – can be a clickable button (e.g., password toggle) */
  rightIcon?: React.ReactNode;
  /** Wrapper className for the outer container */
  wrapperClassName?: string;
}

// ─── Component ─────────────────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      leftIcon,
      rightIcon,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        {/* Left icon */}
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles – dark glass input
            "flex h-10 w-full rounded-xl border bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-white/25",
            "transition-all duration-200 outline-none",
            "focus-visible:ring-0 focus-visible:border-orange-500/50 focus-visible:bg-white/[0.06]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error state – red border + subtle red glow
            error && "border-red-500/50 focus-visible:border-red-500/50 focus-visible:ring-red-500/20",
            // Default border
            !error && "border-white/[0.08]",
            // Adjust padding if icons are present
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Right icon (often a button) */}
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {rightIcon}
          </span>
        )}

        {/* Error message with animated entrance */}
        {error && (
          <motion.div
            id={`${inputId}-error`}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 mt-1.5 ml-1 text-xs text-red-400"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };