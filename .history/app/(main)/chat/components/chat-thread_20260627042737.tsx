"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MessageSquare,
  ArrowDown,
  Sparkles,
  Wifi,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types (mirrors chat/page.tsx) ──────────────────────────────────────────
export type Channel = "sms" | "social" | "voice";
export type MessageRole = "user" | "assistant" | "system";

export interface RagContext {
  id: string;
  content: string;
  similarity: number;
  source: string;
  channel: Channel;
  dataset: string;
}

export interface MessageMetadata {
  model?: string;
  latency?: number;
  tokens?: number;
  ragHits?: number;
}

export interface Message {
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
}

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

export interface ChatThreadProps {
  messages: Message[];
  channelConfig: Record<Channel, ChannelCfg>;
  activeChannel: Channel;
  renderMessage: (message: Message) => React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SCROLL_BOTTOM_THRESHOLD = 120; // px — within this distance counts as "at bottom"
const SCROLL_BTN_SHOW_THRESHOLD = 300; // px — show button beyond this distance from bottom

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameGroup(a: Message, b: Message): boolean {
  return (
    a.role === b.role &&
    a.channel === b.channel &&
    Math.abs(a.timestamp.getTime() - b.timestamp.getTime()) < 90_000 // within 90s
  );
}

// ─── Types for grouped messages ───────────────────────────────────────────────
interface MessageGroup {
  id: string;
  messages: Message[];
  role: MessageRole;
  channel: Channel;
  timestamp: Date;
  showDateSeparator: boolean;
  dateLabel: string;
}

function buildMessageGroups(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  messages.forEach((msg, idx) => {
    const prev = messages[idx - 1];
    const showDateSeparator =
      !prev || !isSameDay(prev.timestamp, msg.timestamp);
    const startNewGroup =
      showDateSeparator ||
      !prev ||
      !isSameGroup(prev, msg);

    if (startNewGroup) {
      groups.push({
        id: `group-${msg.id}`,
        messages: [msg],
        role: msg.role,
        channel: msg.channel,
        timestamp: msg.timestamp,
        showDateSeparator,
        dateLabel: formatDateSeparator(msg.timestamp),
      });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });

  return groups;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated date separator pill */
const DateSeparator = memo(({ label }: { label: string }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0.6 }}
    animate={{ opacity: 1, scaleX: 1 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className="flex items-center gap-3 my-4 px-2"
    aria-label={`Messages from ${label}`}
  >
    <div className="flex-1 h-px bg-white/[0.06]" />
    <span className="text-[10px] font-medium text-white/25 uppercase tracking-widest whitespace-nowrap px-2">
      {label}
    </span>
    <div className="flex-1 h-px bg-white/[0.06]" />
  </motion.div>
));
DateSeparator.displayName = "DateSeparator";

/** Channel transition banner — shows when the channel changes mid-thread */
const ChannelSwitchBanner = memo(
  ({ from, to, cfg }: { from: Channel; to: Channel; cfg: Record<Channel, ChannelCfg> }) => {
    const toCfg = cfg[to];
    const ToIcon = toCfg.icon;
    const fromCfg = cfg[from];
    const FromIcon = fromCfg.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center gap-2 my-3 px-3"
      >
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${fromCfg.textClass} bg-white/[0.05] border border-white/[0.08]`}>
          <FromIcon className="w-2.5 h-2.5" />
          {fromCfg.label}
        </div>
        <Zap className="w-3 h-3 text-orange-400/60" />
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-opacity-15`}
          style={{
            color: toCfg.color,
            borderColor: `${toCfg.color}40`,
            backgroundColor: `${toCfg.color}18`,
          }}
        >
          <ToIcon className="w-2.5 h-2.5" />
          {toCfg.label}
          <span className="text-[9px] opacity-60 ml-0.5">switched</span>
        </div>
      </motion.div>
    );
  }
);
ChannelSwitchBanner.displayName = "ChannelSwitchBanner";

/** Timestamp shown at the bottom of a message group */
const GroupTimestamp = memo(
  ({
    message,
    channelConfig,
  }: {
    message: Message;
    channelConfig: Record<Channel, ChannelCfg>;
  }) => {
    const cfg = channelConfig[message.channel];
    const ChanIcon = cfg.icon;

    return (
      <div
        className={`flex items-center gap-1.5 mt-1 text-[10px] text-white/20 ${
          message.role === "user" ? "justify-end pr-1" : "justify-start pl-1"
        }`}
      >
        <ChanIcon className="w-2.5 h-2.5" style={{ color: cfg.color, opacity: 0.5 }} />
        <span>{formatTime(message.timestamp)}</span>
        {message.metadata?.latency && (
          <>
            <span className="opacity-40">·</span>
            <Clock className="w-2 h-2 opacity-40" />
            <span className="opacity-60">{message.metadata.latency}ms</span>
          </>
        )}
        {message.metadata?.model && (
          <>
            <span className="opacity-40">·</span>
            <span className="opacity-50 font-mono truncate max-w-[100px]">{message.metadata.model.split("/").pop()}</span>
          </>
        )}
      </div>
    );
  }
);
GroupTimestamp.displayName = "GroupTimestamp";

/** Shimmer skeleton for loading state */
const MessageSkeleton = memo(({ side = "left" }: { side?: "left" | "right" }) => (
  <div className={`flex ${side === "right" ? "justify-end" : "justify-start"} px-4 mb-3`}>
    <div className="flex flex-col gap-1.5 max-w-[60%]">
      <div
        className={`h-10 rounded-2xl animate-pulse bg-white/[0.05] ${
          side === "right" ? "w-48" : "w-56"
        }`}
      />
      <div
        className={`h-6 rounded-2xl animate-pulse bg-white/[0.03] ${
          side === "right" ? "w-32 self-end" : "w-40"
        }`}
      />
    </div>
  </div>
));
MessageSkeleton.displayName = "MessageSkeleton";

/** Empty state when no messages exist */
const EmptyState = memo(
  ({
    activeChannel,
    channelConfig,
  }: {
    activeChannel: Channel;
    channelConfig: Record<Channel, ChannelCfg>;
  }) => {
    const cfg = channelConfig[activeChannel];
    const Icon = cfg.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
      >
        {/* Glowing icon */}
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ backgroundColor: cfg.color }}
          />
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center border"
            style={{
              backgroundColor: `${cfg.color}18`,
              borderColor: `${cfg.color}30`,
              boxShadow: `0 0 32px ${cfg.color}25`,
            }}
          >
            <Icon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-[15px] font-semibold text-white/70 mb-2">
          Start a {cfg.label} conversation
        </h3>
        <p className="text-[12px] text-white/30 leading-relaxed max-w-[240px]">
          Messages here are powered by{" "}
          <span className="text-orange-400 font-medium">Featherless AI</span>,{" "}
          enhanced with{" "}
          <span className="text-purple-400 font-medium">RAG context</span>, and
          delivered as{" "}
          <span className="text-sky-400 font-medium">ElevenLabs voice</span>.
        </p>

        {/* Channel pills */}
        <div className="flex items-center gap-2 mt-6">
          {(["sms", "social", "voice"] as Channel[]).map((ch) => {
            const c = channelConfig[ch];
            const CIcon = c.icon;
            return (
              <motion.div
                key={ch}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: ch === activeChannel ? 1 : 0.35, y: 0 }}
                transition={{ delay: 0.1 + ["sms", "social", "voice"].indexOf(ch) * 0.07 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium"
                style={{
                  borderColor: `${c.color}${ch === activeChannel ? "60" : "25"}`,
                  color: c.color,
                  backgroundColor: `${c.color}${ch === activeChannel ? "18" : "08"}`,
                }}
              >
                <CIcon className="w-3 h-3" />
                {c.label}
              </motion.div>
            );
          })}
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-1.5 mt-8 text-[10px] text-white/15"
        >
          <Sparkles className="w-3 h-3 text-orange-500/30" />
          Type a message or click{" "}
          <span className="text-orange-400/50 font-medium">Simulate</span> to
          see the full AI flow
        </motion.p>
      </motion.div>
    );
  }
);
EmptyState.displayName = "EmptyState";

/** Scroll-to-bottom FAB */
const ScrollToBottomButton = memo(
  ({
    visible,
    unreadBelow,
    onClick,
    channelColor,
  }: {
    visible: boolean;
    unreadBelow: number;
    onClick: () => void;
    channelColor: string;
  }) => (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-btn"
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 10 }}
          transition={{ type: "spring", stiffness: 480, damping: 28 }}
          onClick={onClick}
          aria-label="Scroll to latest message"
          className="absolute bottom-4 right-4 z-20 w-9 h-9 rounded-full border border-white/[0.12] bg-[#1A1A1E] shadow-xl flex items-center justify-center hover:bg-[#222226] transition-colors group"
          style={{ boxShadow: `0 4px 24px ${channelColor}30` }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
        >
          <ArrowDown
            className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors"
          />
          {unreadBelow > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: channelColor }}
            >
              {unreadBelow > 9 ? "9+" : unreadBelow}
            </motion.span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  )
);
ScrollToBottomButton.displayName = "ScrollToBottomButton";

/** Streaming live indicator */
const LiveStreamingIndicator = memo(({ color }: { color: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -6 }}
    className="flex items-center gap-1.5 mt-2 ml-1"
  >
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [0.4, 1.2, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.13, ease: "easeInOut" }}
          className="w-0.5 h-3 rounded-full origin-bottom"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
    <span className="text-[10px] font-medium" style={{ color }}>
      Streaming…
    </span>
    <Wifi className="w-2.5 h-2.5 opacity-60" style={{ color }} />
  </motion.div>
));
LiveStreamingIndicator.displayName = "LiveStreamingIndicator";

// ─── Main Component ───────────────────────────────────────────────────────────
export function ChatThread({
  messages,
  channelConfig,
  activeChannel,
  renderMessage,
  isLoading = false,
  className,
}: ChatThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const prefersReducedMotion = useReducedMotion();

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const [prevChannel, setPrevChannel] = useState<Channel | null>(null);
  const [channelSwitches, setChannelSwitches] = useState<
    Map<string, { from: Channel; to: Channel }>
  >(new Map());

  // ─── Build groups ────────────────────────────────────────────────────────
  const groups = useMemo(() => buildMessageGroups(messages), [messages]);

  // ─── Detect channel switches between groups ───────────────────────────────
  useEffect(() => {
    const switches = new Map<string, { from: Channel; to: Channel }>();
    for (let i = 1; i < groups.length; i++) {
      if (groups[i].channel !== groups[i - 1].channel) {
        switches.set(groups[i].id, {
          from: groups[i - 1].channel,
          to: groups[i].channel,
        });
      }
    }
    setChannelSwitches(switches);
  }, [groups]);

  // ─── Active channel change ────────────────────────────────────────────────
  useEffect(() => {
    setPrevChannel((prev) => {
      if (prev !== null && prev !== activeChannel) return prev;
      return activeChannel;
    });
    // After a brief delay, update prevChannel to current
    const t = setTimeout(() => setPrevChannel(activeChannel), 600);
    return () => clearTimeout(t);
  }, [activeChannel]);

  // ─── Scroll logic ─────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: prefersReducedMotion ? "instant" : behavior,
    });
    setShowScrollBtn(false);
    setUnreadBelow(0);
  }, [prefersReducedMotion]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom < SCROLL_BOTTOM_THRESHOLD;
    setShowScrollBtn(distFromBottom > SCROLL_BTN_SHOW_THRESHOLD);
    if (isAtBottomRef.current) setUnreadBelow(0);
  }, []);

  // ─── Auto-scroll on new messages ─────────────────────────────────────────
  useEffect(() => {
    const newCount = messages.length;
    const addedMessages = newCount - prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;

    if (addedMessages <= 0) return;

    if (isAtBottomRef.current) {
      // Small rAF to ensure DOM painted before scroll
      requestAnimationFrame(() => scrollToBottom("smooth"));
    } else {
      // User has scrolled up — increment unread counter
      const newMsgs = messages.slice(-addedMessages);
      const hasAssistantMsg = newMsgs.some((m) => m.role === "assistant");
      if (hasAssistantMsg) setUnreadBelow((p) => p + addedMessages);
    }
  }, [messages, scrollToBottom]);

  // ─── Initial scroll on mount ─────────────────────────────────────────────
  useEffect(() => {
    scrollToBottom("instant");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Scroll to bottom when active conversation changes ────────────────────
  const lastActiveChannel = useRef(activeChannel);
  useEffect(() => {
    if (lastActiveChannel.current !== activeChannel) {
      lastActiveChannel.current = activeChannel;
      requestAnimationFrame(() => scrollToBottom("instant"));
    }
  }, [activeChannel, scrollToBottom]);

  // ─── Check if last message is streaming ──────────────────────────────────
  const lastMessage = messages[messages.length - 1];
  const isStreaming = lastMessage?.isStreaming === true;

  const activeCfg = channelConfig[activeChannel];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={cn("relative flex-1 min-h-0 flex flex-col overflow-hidden", className)}
    >
      {/* Background grid overlay — subtle depth effect */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `
            linear-gradient(${activeCfg.color}22 1px, transparent 1px),
            linear-gradient(90deg, ${activeCfg.color}22 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          transition: "background-image 0.6s ease",
        }}
      />

      {/* Scrollable message list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.06) transparent",
        }}
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
      >
        {/* Loading skeletons */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MessageSkeleton side="left" />
            <MessageSkeleton side="right" />
            <MessageSkeleton side="left" />
            <MessageSkeleton side="right" />
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <EmptyState
            activeChannel={activeChannel}
            channelConfig={channelConfig}
          />
        )}

        {/* Message groups */}
        {!isLoading && groups.length > 0 && (
          <div className="space-y-0.5">
            {groups.map((group, groupIdx) => {
              const chanSwitch = channelSwitches.get(group.id);
              const lastMsg = group.messages[group.messages.length - 1];

              return (
                <React.Fragment key={group.id}>
                  {/* Date separator */}
                  {group.showDateSeparator && (
                    <DateSeparator label={group.dateLabel} />
                  )}

                  {/* Channel switch banner */}
                  {chanSwitch && (
                    <ChannelSwitchBanner
                      from={chanSwitch.from}
                      to={chanSwitch.to}
                      cfg={channelConfig}
                    />
                  )}

                  {/* Message group container */}
                  <motion.div
                    key={group.id}
                    initial={
                      prefersReducedMotion
                        ? false
                        : {
                            opacity: 0,
                            y: group.role === "user" ? 10 : 8,
                            scale: 0.98,
                          }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                      delay: groupIdx === 0 ? 0 : 0,
                    }}
                    className="mb-1"
                  >
                    {/* Stacked messages within the group */}
                    <div className="space-y-0.5">
                      {group.messages.map((msg, msgIdx) => {
                        const isLast = msgIdx === group.messages.length - 1;
                        const isFirst = msgIdx === 0;

                        return (
                          <motion.div
                            key={msg.id}
                            layout="position"
                            initial={
                              prefersReducedMotion
                                ? false
                                : { opacity: 0, y: 6 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.22,
                              delay: isFirst ? 0 : msgIdx * 0.04,
                              ease: "easeOut",
                            }}
                          >
                            {renderMessage(msg)}

                            {/* Streaming indicator on last streaming msg */}
                            <AnimatePresence>
                              {isLast && msg.isStreaming && (
                                <motion.div
                                  className={`flex ${msg.role === "user" ? "justify-end pr-1" : "justify-start pl-1"}`}
                                >
                                  <LiveStreamingIndicator
                                    color={channelConfig[msg.channel].color}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Group timestamp footer */}
                    <GroupTimestamp
                      message={lastMsg}
                      channelConfig={channelConfig}
                    />
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Invisible anchor for scroll-to-bottom */}
        <div ref={bottomRef} className="h-1 w-full" aria-hidden />
      </div>

      {/* Scroll-to-bottom FAB */}
      <ScrollToBottomButton
        visible={showScrollBtn}
        unreadBelow={unreadBelow}
        onClick={() => scrollToBottom("smooth")}
        channelColor={activeCfg.color}
      />

      {/* Channel color pulse glow at top edge — decorative */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-12"
        animate={{
          background: `linear-gradient(to bottom, ${activeCfg.color}14, transparent)`,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Bottom fade gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
        style={{
          background: "linear-gradient(to top, #09090B 0%, transparent 100%)",
        }}
      />
    </div>
  );
}