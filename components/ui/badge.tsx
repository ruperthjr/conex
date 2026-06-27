"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Orange‑themed badge variants ──────────────────────────────────────────
const badgeVariants = cva(
  cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background",
    "whitespace-nowrap" // prevents wrapping
  ),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-white text-black hover:bg-white/90",
        orange:
          "border-transparent bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500",
        "orange-outline":
          "border border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20",
        secondary:
          "border-transparent bg-white/10 text-white hover:bg-white/15",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-500",
        outline:
          "border border-white/10 text-white/60 hover:text-white hover:bg-white/5",
        "outline-orange":
          "border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// ─── Badge Component ────────────────────────────────────────────────────────
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };