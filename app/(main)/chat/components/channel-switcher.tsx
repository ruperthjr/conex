"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Share2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types (mirrors app/(main)/chat/page.tsx) ───────────────────────────────
export type Channel = "sms" | "social" | "voice";

export interface ChannelCfg {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
}

interface ChannelSwitcherProps {
  activeChannel: Channel;
  onChannelSwitch: (channel: Channel) => void;
  channelConfig: Record<Channel, ChannelCfg>;
  className?: string;
  disabled?: boolean;
}

// ─── Fallback icons / labels when config is incomplete ───────────────────────
const DEFAULT_ICONS: Record<Channel, React.ElementType> = {
  sms: MessageSquare,
  social: Share2,
  voice: Phone,
};

const DEFAULT_LABELS: Record<Channel, string> = {
  sms: "SMS",
  social: "Social",
  voice: "Voice",
};

// ─── Component ───────────────────────────────────────────────────────────────
export const ChannelSwitcher = memo(function ChannelSwitcher({
  activeChannel,
  onChannelSwitch,
  channelConfig,
  className,
  disabled = false,
}: ChannelSwitcherProps) {
  const channels: Channel[] = ["sms", "social", "voice"];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-[#0C0C0E] p-0.5",
        className
      )}
      role="radiogroup"
      aria-label="Communication channel selector"
    >
      {channels.map((ch) => {
        const cfg: ChannelCfg | undefined = channelConfig[ch];
        const isActive = ch === activeChannel;
        const Icon = cfg?.icon ?? DEFAULT_ICONS[ch];
        const label = cfg?.label ?? DEFAULT_LABELS[ch];
        const channelColor = cfg?.color ?? "#FF6B00";

        return (
          <motion.button
            key={ch}
            onClick={() => onChannelSwitch(ch)}
            disabled={disabled}
            role="radio"
            aria-checked={isActive}
            aria-label={`Switch to ${label}`}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0C0C0E]",
              isActive ? "text-white" : "text-white/40 hover:text-white/70"
            )}
            animate={{
              backgroundColor: isActive ? channelColor + "18" : "rgba(0,0,0,0)",
              borderColor: isActive ? channelColor + "30" : "rgba(0,0,0,0)",
              borderWidth: isActive ? "1px" : "0px",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
          >
            <Icon
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: isActive ? channelColor : "currentColor" }}
            />
            <span className="hidden sm:inline">{label}</span>
            {/* Live activity dot on the active channel */}
            {isActive && (
              <motion.div
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: channelColor }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
});