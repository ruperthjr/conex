"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Root Avatar ──────────────────────────────────────────────────────────
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      "border-2 border-orange-500/20 shadow-lg shadow-orange-500/10",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

// ─── Avatar Image ─────────────────────────────────────────────────────────
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

// ─── Avatar Fallback (orange themed) ──────────────────────────────────────
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    /** Optional delay before showing the fallback (ms) */
    delayMs?: number;
  }
>(({ className, children, delayMs = 0, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-gradient-to-br from-orange-500 to-orange-700 text-white font-bold text-sm",
      "uppercase tracking-wider",
      className
    )}
    {...props}
    asChild
  >
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: delayMs / 1000 }}
    >
      {children}
    </motion.span>
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
