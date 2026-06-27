"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Orange‑themed card variants ────────────────────────────────────────
const cardVariants = cva(
  cn(
    "rounded-2xl border bg-[#0C0C0E]/80 backdrop-blur-xl",
    "text-white shadow-xl transition-all duration-300",
    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4"
  ),
  {
    variants: {
      variant: {
        default:
          "border-white/[0.08] shadow-black/10",
        orange:
          "border-orange-500/20 bg-gradient-to-br from-[#0C0C0E] to-orange-950/30 shadow-orange-500/10",
        "orange-outline":
          "border-orange-500/30 bg-transparent shadow-orange-500/5",
        "orange-glow":
          cn(
            "border-orange-500/25 bg-[#0C0C0E]",
            "shadow-[0_0_20px_rgba(255,107,0,0.2)]",
            "hover:shadow-[0_0_30px_rgba(255,107,0,0.35)]"
          ),
        ghost:
          "border-transparent bg-white/[0.02] hover:bg-white/[0.04]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// ─── Card Component ─────────────────────────────────────────────────────
export interface CardProps
  extends HTMLMotionProps<"div">,
    VariantProps<typeof cardVariants> {
  /** Optional entrance animation – set false to disable */
  animate?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, animate = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        initial={animate ? { opacity: 0, y: 12 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";

// ─── Sub‑components ─────────────────────────────────────────────────────
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white/90",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/50", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};