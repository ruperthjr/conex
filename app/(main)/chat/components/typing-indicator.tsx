"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Bot, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Local type definitions (mirrors chat/page.tsx) ───────────────────────
type Channel = "sms" | "social" | "voice";

interface ChannelCfg {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
}

// ─── Dot animation variants ───────────────────────────────────────────────
const dotVariants = {
  animate: (i: number) => ({
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.12,
    },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────
interface TypingIndicatorProps {
  channel: Channel;
  channelConfig: Record<Channel, ChannelCfg>;
  aiModel?: string;
  className?: string;
}

export const TypingIndicator = memo(function TypingIndicator({
  channel,
  channelConfig,
  aiModel = "Featherless AI",
  className,
}: TypingIndicatorProps) {
  const cfg = channelConfig[channel];
  const channelColor = cfg?.color ?? "#FF6B00";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-2xl w-fit max-w-[280px]",
        "bg-white/[0.04] border border-white/[0.06] shadow-sm",
        className
      )}
      role="status"
      aria-label={`${aiModel} is typing`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${channelColor}cc, ${channelColor}88)`,
          boxShadow: `0 0 12px ${channelColor}40`,
        }}
      >
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: channelColor }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[12px] font-medium text-white/70 truncate">
          {aiModel}
        </span>
        <span className="text-[12px] text-white/40">is typing</span>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="text-orange-400"
        >
          …
        </motion.span>
      </div>

      {/* Subtle glow indicator */}
      <motion.div
        className="w-2 h-2 rounded-full shrink-0 ml-auto"
        style={{
          backgroundColor: channelColor,
          boxShadow: `0 0 6px ${channelColor}cc`,
        }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      />
    </motion.div>
  );
});