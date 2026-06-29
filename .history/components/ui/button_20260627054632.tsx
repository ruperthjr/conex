"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Orange-themed variant constants ────────────────────────────────────
const ORANGE_GRADIENT =
  "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400";
const ORANGE_SHADOW = "shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30";
const ORANGE_GHOST_HOVER = "hover:bg-orange-500/10 hover:text-orange-400";
const ORANGE_OUTLINE =
  "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50";

// ─── Base button styles ─────────────────────────────────────────────────
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "text-sm font-semibold transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98] select-none",
    "motion-safe:transition motion-safe:duration-150" // subtle animation
  ),
  {
    variants: {
      variant: {
        default: cn("bg-white text-black hover:bg-white/90 shadow-sm"),
        orange: cn(ORANGE_GRADIENT, "text-white", ORANGE_SHADOW),
        destructive: cn("bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20"),
        outline: cn(
          "border border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20"
        ),
        "outline-orange": cn(
          "border bg-transparent",
          ORANGE_OUTLINE
        ),
        ghost: cn("text-white/60 hover:bg-white/5 hover:text-white"),
        "ghost-orange": cn("text-white/60", ORANGE_GHOST_HOVER),
        link: cn("text-white underline-offset-4 hover:underline hover:text-orange-400"),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

// ─── Types ─────────────────────────────────────────────────────────────
export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

// ─── Component ─────────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const motionProps = !asChild
      ? {
          whileHover: !disabled && !isLoading ? { scale: 1.02 } : undefined,
          whileTap: !disabled && !isLoading ? { scale: 0.97 } : undefined,
        }
      : undefined;

    const { style, ...buttonProps } = props as HTMLMotionProps<"button">;

    const sharedProps = {
      className: cn(buttonVariants({ variant, size, fullWidth, className })),
      disabled: disabled || isLoading,
      ...(buttonProps as React.ComponentPropsWithoutRef<"button">),
    };

    if (asChild) {
      return (
        <Slot ref={ref} {...sharedProps}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : leftIcon ? (
            <span className="shrink-0">{leftIcon}</span>
          ) : null}
          {children}
          {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={sharedProps.className}
        disabled={sharedProps.disabled}
        style={style}
        {...motionProps}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };