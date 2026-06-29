"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Clock,
  Cpu,
  Hash,
  Radio,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types (imported from chat page – minimised copy here to avoid build issues if page.tsx not ready) ─
// In a full project these would live in a shared types/chat.ts
type Channel = "sms" | "social" | "voice";
type MessageRole = "user" | "assistant" | "system";

interface RagContext {
  id: string;
  content: string;
  similarity: number;
  source: string;
  channel: Channel;
  dataset: string;
}

interface MessageMetadata {
  model?: string;
  latency?: number;
  tokens?: number;
  ragHits?: number;
}

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  channel: Channel;
  timestamp: Date;
  ragContexts?: RagContext[];
  audioUrl?: string;
  isStreaming?: boolean;
  isVoiceReady?: boolean;
  metadata?: MessageMetadata;
  isError?: boolean;
}

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

// ─── Constants ───────────────────────────────────────────────────────────────
const CHANNEL_ICONS: Record<Channel, React.ElementType> = {
  sms: MessageSquare,
  social: Radio,
  voice: Radio, // generic; replaced by dynamic icon from config
};

// ─── Helper components ──────────────────────────────────────────────────────

/** Streaming cursor animation */
const StreamingCursor = memo(({ color }: { color: string }) => (
  <motion.span
    className="inline-block w-[2px] h-[1em] ml-0.5 align-middle rounded-full"
    style={{ backgroundColor: color }}
    animate={{ opacity: [1, 0.3, 1] }}
    transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
  />
));
StreamingCursor.displayName = "StreamingCursor";

/** Metadata pill — shows model, latency, tokens */
const MetadataPill = memo(
  ({
    metadata,
    channelColor,
  }: {
    metadata: MessageMetadata;
    channelColor: string;
  }) => {
    const items: string[] = [];
    if (metadata.model) items.push(metadata.model.split("/").pop() ?? metadata.model);
    if (metadata.latency) items.push(`${metadata.latency}ms`);
    if (metadata.tokens) items.push(`${metadata.tokens} tok`);

    if (items.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-1 mt-1.5"
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium border"
            style={{
              color: `${channelColor}cc`,
              borderColor: `${channelColor}30`,
              backgroundColor: `${channelColor}10`,
            }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    );
  }
);
MetadataPill.displayName = "MetadataPill";

// ─── Main Component ──────────────────────────────────────────────────────────

export interface MessageBubbleProps {
  message: Message;
  channelConfig: Record<Channel, ChannelCfg>;
  ragHighlight?: React.ReactNode;
  voiceButton?: React.ReactNode;
  className?: string;
}

export function MessageBubble({
  message,
  channelConfig,
  ragHighlight,
  voiceButton,
  className,
}: MessageBubbleProps) {
  const { role, channel, content, timestamp, isStreaming, metadata, isError } = message;
  const cfg = channelConfig[channel];
  const ChanIcon = cfg.icon;

  // Determine bubble styling based on role
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  // Base container alignment
  const alignmentClass = isUser
    ? "justify-end"
    : isSystem
    ? "justify-center"
    : "justify-start";

  // Bubble colors
  const bubbleBg = isUser
    ? `bg-gradient-to-br ${cfg.gradientFrom} ${cfg.gradientTo} shadow-lg shadow-[${cfg.color}]/20`
    : "bg-white/[0.04] border border-white/[0.06]";

  const textColor = isUser ? "text-white" : "text-white/90";
  const timestampColor = isUser ? "text-white/50" : "text-white/25";

  // Avatar
  const AvatarIcon = isAssistant ? Bot : User;
  const avatarBg = isAssistant
    ? "bg-gradient-to-br from-orange-500 to-orange-700"
    : `${cfg.bgClass} bg-opacity-80`;

  // Entrance animation
  const slideDirection = isUser ? { x: 20 } : { x: -20 };

  return (
    <motion.div
      className={cn("flex w-full px-4 py-1 first:pt-2 last:pb-2", alignmentClass, className)}
      initial={{ opacity: 0, ...slideDirection }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      role="listitem"
      aria-label={`${role} message at ${timestamp.toLocaleTimeString()}`}
    >
      {/* System message – centered, no avatar */}
      {isSystem && (
        <motion.div
          className="max-w-[80%] rounded-2xl px-4 py-2 bg-white/[0.02] border border-white/[0.04] text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[11px] text-white/40 italic leading-relaxed">{content}</p>
          <p className="text-[9px] text-white/20 mt-0.5">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </motion.div>
      )}

      {/* User / Assistant messages */}
      {!isSystem && (
        <div
          className={cn(
            "flex items-end gap-2 max-w-[85%]",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Avatar */}
          <div className="shrink-0 self-end mb-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white shadow",
                avatarBg
              )}
            >
              <AvatarIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bubble + extras */}
          <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
            {/* Channel icon + timestamp (above bubble) */}
            <div
              className={cn(
                "flex items-center gap-1 mb-0.5 text-[9px]",
                isUser ? "flex-row-reverse" : "flex-row",
                timestampColor
              )}
            >
              <ChanIcon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
              <span>{timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              {isError && (
                <span className="text-red-400 font-medium">Failed · Retry</span>
              )}
            </div>

            {/* Main bubble */}
            <motion.div
              className={cn(
                "relative px-4 py-2.5 rounded-2xl break-words text-[14px] leading-relaxed",
                bubbleBg,
                textColor,
                isUser
                  ? "rounded-br-md"
                  : "rounded-bl-md",
                "shadow-sm"
              )}
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
            >
              {/* Streaming cursor – shown only while streaming */}
              {isStreaming ? (
                <span className="inline">
                  {content}
                  <StreamingCursor color={cfg.color} />
                </span>
              ) : (
                <span>{content}</span>
              )}
            </motion.div>

            {/* Metadata pill */}
            {metadata && (
              <MetadataPill metadata={metadata} channelColor={cfg.color} />
            )}

            {/* RAG context highlight – rendered as passed */}
            {ragHighlight && (
              <div className="mt-1.5 w-full max-w-[300px]">{ragHighlight}</div>
            )}

            {/* Voice reply button – rendered as passed */}
            {voiceButton && <div className="mt-1.5">{voiceButton}</div>}
          </div>
        </div>
      )}
    </motion.div>
  );
}