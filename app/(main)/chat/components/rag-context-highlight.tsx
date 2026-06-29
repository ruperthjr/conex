"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Zap,
  Target,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types (mirrors chat/page.tsx) ──────────────────────────────────────────
export type Channel = "sms" | "social" | "voice";

export interface RagContext {
  id: string;
  content: string;
  similarity: number;
  source: string;
  channel: Channel;
  dataset: string;
}

interface RagContextHighlightProps {
  contexts: RagContext[];
  compact?: boolean;
  className?: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function similarityToColor(sim: number): string {
  if (sim >= 0.95) return "#FF6B00"; // Deep orange
  if (sim >= 0.85) return "#F97316";
  if (sim >= 0.7) return "#FBBF24";
  return "#F59E0B";
}

function similarityLabel(sim: number): string {
  if (sim >= 0.95) return "Very High";
  if (sim >= 0.85) return "High";
  if (sim >= 0.7) return "Medium";
  return "Low";
}

// ─── Sub-component: Single context item ─────────────────────────────────────
const ContextItem = memo(function ContextItem({
  ctx,
  compact,
}: {
  ctx: RagContext;
  compact: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const scoreColor = similarityToColor(ctx.similarity);
  const scoreLabel = similarityLabel(ctx.similarity);

  const previewLength = compact ? 50 : 80;
  const isLong = ctx.content.length > previewLength;
  const displayContent =
    isLong && !expanded
      ? ctx.content.slice(0, previewLength) + "…"
      : ctx.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 group hover:border-orange-500/20 transition-colors"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: scoreColor + "22" }}
          >
            <Target className="w-2.5 h-2.5" style={{ color: scoreColor }} />
          </div>
          <span className="text-[10px] font-semibold text-white/60 truncate">
            {ctx.dataset ?? (ctx.source ?? "").split("/").pop() ?? "unknown"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div
            className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
            style={{
              color: scoreColor,
              backgroundColor: scoreColor + "18",
              border: `1px solid ${scoreColor}30`,
            }}
          >
            {Math.round(ctx.similarity * 100)}%
          </div>
          {!compact && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full border"
              style={{
                color: ctx.channel === "sms" ? "#FF6B00" : ctx.channel === "social" ? "#7C3AED" : "#0EA5E9",
                borderColor: ctx.channel === "sms" ? "#FF6B00" + "30" : ctx.channel === "social" ? "#7C3AED30" : "#0EA5E930",
                backgroundColor: ctx.channel === "sms" ? "#FF6B00" + "10" : ctx.channel === "social" ? "#7C3AED10" : "#0EA5E910",
              }}
            >
              {ctx.channel ? ctx.channel.toUpperCase() : "UNKNOWN"}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-[11px] text-white/45 leading-relaxed break-words">
        {displayContent}
      </p>

      {/* Expand/collapse button if content truncated */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-[10px] text-orange-400/70 hover:text-orange-400 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show more
            </>
          )}
        </button>
      )}

      {/* Source info line */}
      <div className="mt-2 flex items-center gap-2 text-[9px] text-white/25">
        <Database className="w-3 h-3" />
        <span className="truncate max-w-[160px]">{ctx.source}</span>
        {!compact && (
          <span className="opacity-40">· {scoreLabel} relevance</span>
        )}
      </div>
    </motion.div>
  );
});

// ─── Main Component ─────────────────────────────────────────────────────────
export const RagContextHighlight = memo(function RagContextHighlight({
  contexts,
  compact = false,
  className,
}: RagContextHighlightProps) {
  if (!contexts || contexts.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with count */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-500 to-orange-600" />
        <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
          RAG Context
        </h4>
        <span className="text-[10px] text-white/20">
          ({contexts.length} {contexts.length === 1 ? "source" : "sources"})
        </span>
        <Zap className="w-3 h-3 text-orange-400/50 ml-auto" />
      </div>

      {/* List with stagger animation */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {contexts.map((ctx) => (
            <ContextItem key={ctx.id} ctx={ctx} compact={compact} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});