"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// ─── Provider ──────────────────────────────────────────────────────────
const TooltipProvider = TooltipPrimitive.Provider;

// ─── Root ──────────────────────────────────────────────────────────────
const Tooltip = TooltipPrimitive.Root;

// ─── Trigger ───────────────────────────────────────────────────────────
const TooltipTrigger = TooltipPrimitive.Trigger;

// ─── Content ───────────────────────────────────────────────────────────
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // Base styling – dark glass with orange border/glow
      "z-50 overflow-hidden rounded-xl border border-orange-500/20",
      "bg-[#0C0C0E]/95 backdrop-blur-xl px-3 py-1.5 text-xs text-white shadow-xl",
      "shadow-orange-500/10",
      // Entrance animation
      "animate-in fade-in-0 zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  >
    {props.children}
    <TooltipPrimitive.Arrow className="fill-orange-500/30" />
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};