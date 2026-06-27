"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Shared orange indicator underline ────────────────────────────────────
const OrangeIndicator = ({ className }: { className?: string }) => (
  <motion.div
    layoutId="orange-tab-indicator"
    className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-orange-500 rounded-full", className)}
    transition={{ type: "spring", stiffness: 500, damping: 30 }}
  />
);

// ─── Root Tabs ────────────────────────────────────────────────────────────
const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

// ─── Tabs List ─────────────────────────────────────────────────────────────
interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Show an animated orange underline that slides between triggers */
  showIndicator?: boolean;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, showIndicator = true, children, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#0C0C0E] p-0.5 text-white/60",
      className
    )}
    {...props}
  >
    {children}
    {showIndicator && <OrangeIndicator />}
  </TabsPrimitive.List>
));
TabsList.displayName = TabsPrimitive.List.displayName;

// ─── Tabs Trigger ──────────────────────────────────────────────────────────
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    /** Optional icon to display alongside the label */
    icon?: React.ReactNode;
  }
>(({ className, children, icon, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
      "hover:text-white/80",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50",
      // Active state: orange text, subtle orange bg
      "data-[state=active]:text-orange-400 data-[state=active]:bg-orange-500/10 data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    {children}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// ─── Tabs Content ──────────────────────────────────────────────────────────
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none",
      // Entry animation
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2",
      "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-bottom-2",
      className
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.Content>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };