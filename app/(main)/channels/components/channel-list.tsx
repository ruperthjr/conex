"use client";

import React, { memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Wifi,
  WifiOff,
  Activity,
  Clock,
  MessageSquare,
  Share2,
  Phone,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Import types from parent page (or define locally if needed) ────────
import type { Channel, ChannelStatus, ChannelInfo } from "../page";

// ─── UI Primitives ───────────────────────────────────────────────────────
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Props ───────────────────────────────────────────────────────────────
interface ChannelListProps {
  channels: ChannelInfo[];
  onToggleChannel: (channelId: Channel) => void;
  className?: string;
}

// ─── Status badge helper ─────────────────────────────────────────────────
function statusBadge(status: ChannelStatus) {
  switch (status) {
    case "connected":
      return (
        <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
          <Wifi className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case "connecting":
      return (
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
          <Activity className="w-3 h-3 mr-1 animate-pulse" />
          Connecting
        </Badge>
      );
    case "disconnected":
      return (
        <Badge variant="outline" className="border-white/10 text-white/30 bg-white/5">
          <WifiOff className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Sub-component: Channel Row ─────────────────────────────────────────
const ChannelRow = memo(function ChannelRow({
  channel,
  onToggle,
}: {
  channel: ChannelInfo;
  onToggle: (id: Channel) => void;
}) {
  const Icon = channel.icon;
  const handleClick = useCallback(() => onToggle(channel.id), [channel.id, onToggle]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors"
    >
      {/* Left: Icon & name */}
      <div className="flex items-center gap-3 min-w-[140px]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${channel.color}18` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: channel.color }} />
        </div>
        <div>
          <p className="text-sm font-medium text-white/90">{channel.name}</p>
          <p className="text-[10px] text-white/35">{channel.partner}</p>
        </div>
      </div>

      {/* Center: metrics */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 flex-1">
        <div className="text-xs text-white/50">
          <span className="text-white/30 mr-1">Messages:</span>
          <span className="font-medium text-white/70">{channel.messagesToday}</span>
        </div>
        <div className="text-xs text-white/50">
          <span className="text-white/30 mr-1">Latency:</span>
          <span className="font-medium text-white/70">
            {channel.latency > 0 ? `${channel.latency}ms` : "—"}
          </span>
        </div>
        <div className="text-xs text-white/50 flex items-center gap-1">
          <Clock className="w-3 h-3 text-white/25" />
          <span className="text-white/30 mr-1">Last active:</span>
          <span className="font-medium text-white/70">
            {channel.lastActivity.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Right: status + toggle */}
      <div className="flex items-center gap-3 self-end sm:self-auto">
        {statusBadge(channel.status)}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                channel.status === "connected"
                  ? "text-green-400 hover:bg-green-500/10"
                  : channel.status === "connecting"
                  ? "text-yellow-400 cursor-wait"
                  : "text-white/30 hover:bg-white/5"
              )}
              disabled={channel.status === "connecting"}
              aria-label={`${channel.status === "connected" ? "Disconnect" : "Connect"} ${channel.name}`}
            >
              {channel.status === "connected" ? (
                <ToggleRight className="w-5 h-5" />
              ) : channel.status === "connecting" ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {channel.status === "connected"
              ? "Disconnect"
              : channel.status === "connecting"
              ? "Connecting..."
              : "Connect"}
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────
export function ChannelList({ channels, onToggleChannel, className }: ChannelListProps) {
  if (!channels || channels.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
          <Activity className="w-6 h-6 text-white/15" />
        </div>
        <p className="text-white/40 font-medium">No channels configured</p>
        <p className="text-xs text-white/20 mt-1">Add a channel to start monitoring</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("divide-y divide-white/[0.04]", className)}>
        {channels.map((channel) => (
          <ChannelRow key={channel.id} channel={channel} onToggle={onToggleChannel} />
        ))}
      </div>
    </TooltipProvider>
  );
}