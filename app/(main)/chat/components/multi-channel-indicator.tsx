"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Share2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types (mirrors chat/page.tsx – can be moved to shared types later) ────
export type Channel = "sms" | "social" | "voice";

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

interface MultiChannelIndicatorProps {
  channels: Channel[];
  activeChannel: Channel;
  onChannelClick: (channel: Channel) => void;
  channelConfig?: Record<Channel, ChannelCfg>;
  className?: string;
  disabled?: boolean;
}

// ─── Fallback config if none provided ──────────────────────────────────────
const FALLBACK_CHANNEL_CONFIG: Record<Channel, ChannelCfg> = {
  sms: {
    label: "SMS",
    color: "#FF6B00",
    bgClass: "bg-orange-500",
    textClass: "text-orange-400",
    borderClass: "border-orange-500",
    icon: MessageSquare,
    gradientFrom: "from-orange-600",
    gradientTo: "to-orange-400",
  },
  social: {
    label: "Social",
    color: "#7C3AED",
    bgClass: "bg-purple-600",
    textClass: "text-purple-400",
    borderClass: "border-purple-500",
    icon: Share2,
    gradientFrom: "from-purple-700",
    gradientTo: "to-purple-400",
  },
  voice: {
    label: "Voice",
    color: "#0EA5E9",
    bgClass: "bg-sky-500",
    textClass: "text-sky-400",
    borderClass: "border-sky-500",
    icon: Phone,
    gradientFrom: "from-sky-600",
    gradientTo: "to-sky-400",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────
export const MultiChannelIndicator = memo(function MultiChannelIndicator({
  channels,
  activeChannel,
  onChannelClick,
  channelConfig = FALLBACK_CHANNEL_CONFIG,
  className,
  disabled = false,
}: MultiChannelIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="toolbar"
      aria-label="Active communication channels"
    >
      {channels.map((ch) => {
        const cfg = channelConfig[ch];
        const isActive = ch === activeChannel;
        const Icon = cfg.icon;
        const color = cfg.color;

        return (
          <motion.button
            key={ch}
            onClick={() => onChannelClick(ch)}
            disabled={disabled}
            className={cn(
              "relative flex items-center justify-center w-8 h-8 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#101012]",
              "hover:bg-white/[0.05] active:bg-white/[0.08]"
            )}
            whileHover={disabled ? {} : { scale: 1.08 }}
            whileTap={disabled ? {} : { scale: 0.92 }}
            aria-label={`Switch to ${cfg.label} channel`}
            aria-pressed={isActive}
            title={cfg.label}
          >
            {/* Active channel glow */}
            {isActive && (
              <motion.div
                layoutId="active-channel-indicator"
                className="absolute inset-0 rounded-xl ring-1 ring-offset-0 opacity-70"
                style={{
                  backgroundColor: `${color}22`,
                  boxShadow: `0 0 12px ${color}33`,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            {/* Icon with color transitions */}
            <Icon
              className={cn(
                "w-4 h-4 transition-all duration-200",
                isActive ? "text-white" : "text-white/35"
              )}
              style={{ color: isActive ? color : undefined }}
            />

            {/* Pulsing dot for active channel */}
            {isActive && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#101012]"
                style={{ backgroundColor: color }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            )}

            {/* Inactive channel subtle indicator */}
            {!isActive && (
              <div
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-0.5 rounded-full"
                style={{
                  backgroundColor: `${color}40`,
                  opacity: 0.5,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
});