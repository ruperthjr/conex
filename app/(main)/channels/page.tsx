"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Share2,
  Phone,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────
import { ChannelList } from "./components/channel-list";
import { ZernioConnect } from "./components/zernio-connect";

// ─── UI Primitives (Shadcn/UI) ───────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────
export type Channel = "sms" | "social" | "voice";
export type ChannelStatus = "connected" | "disconnected" | "connecting" | "error";

export interface ChannelInfo {
  id: Channel;
  name: string;
  icon: React.ElementType;
  color: string;
  bgClass: string;
  textClass: string;
  status: ChannelStatus;
  messagesToday: number;
  latency: number; // ms
  lastActivity: Date;
  partner: string;
}

// ─── Mock data (replace with real API later) ──────────────────────────────
function generateMockChannels(): ChannelInfo[] {
  return [
    {
      id: "sms",
      name: "SMS",
      icon: MessageSquare,
      color: "#FF6B00",
      bgClass: "bg-orange-500",
      textClass: "text-orange-400",
      status: "connected",
      messagesToday: 145,
      latency: 320,
      lastActivity: new Date(Date.now() - 120_000),
      partner: "Twilio",
    },
    {
      id: "social",
      name: "Social",
      icon: Share2,
      color: "#7C3AED",
      bgClass: "bg-purple-600",
      textClass: "text-purple-400",
      status: "connected",
      messagesToday: 89,
      latency: 580,
      lastActivity: new Date(Date.now() - 60_000),
      partner: "Zernio",
    },
    {
      id: "voice",
      name: "Voice",
      icon: Phone,
      color: "#0EA5E9",
      bgClass: "bg-sky-500",
      textClass: "text-sky-400",
      status: "disconnected",
      messagesToday: 23,
      latency: 0,
      lastActivity: new Date(Date.now() - 3600_000),
      partner: "ElevenLabs",
    },
  ];
}

// ─── Page Component ───────────────────────────────────────────────────────
export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────
  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: replace with real API call when backend is ready
      // const res = await fetch("/api/v1/channels");
      // const data = await res.json();
      // setChannels(data);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setChannels(generateMockChannels());
    } catch (e: any) {
      setError(e.message || "Failed to load channels");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChannels();
  };

  // ── Toggle channel connection (simulated) ──────────────────────────────
  const handleToggleChannel = useCallback((channelId: Channel) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? {
              ...ch,
              status:
                ch.status === "connected"
                  ? "disconnected"
                  : ch.status === "disconnected"
                  ? "connecting"
                  : ch.status,
            }
          : ch
      )
    );
    // Simulate async connection
    setTimeout(() => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId && ch.status === "connecting"
            ? { ...ch, status: "connected", latency: Math.floor(Math.random() * 500 + 200) }
            : ch
        )
      );
    }, 1500);
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalMessages = channels.reduce((sum, ch) => sum + ch.messagesToday, 0);
  const activeChannels = channels.filter((ch) => ch.status === "connected").length;
  const avgLatency =
    channels
      .filter((ch) => ch.status === "connected" && ch.latency > 0)
      .reduce((sum, ch) => sum + ch.latency, 0) / (activeChannels || 1);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-[#09090B] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* ─── Page Header ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Channel Management
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Configure and monitor your communication channels
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh channel status</TooltipContent>
              </Tooltip>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Channel
              </Button>
            </div>
          </motion.div>

          {/* ─── Summary Cards ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {[
              {
                label: "Total Messages Today",
                value: totalMessages,
                icon: Activity,
                color: "text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                label: "Active Channels",
                value: `${activeChannels} / ${channels.length}`,
                icon: Wifi,
                color: "text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
              },
              {
                label: "Avg Latency",
                value: `${Math.round(avgLatency)}ms`,
                icon: Clock,
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
              },
            ].map((card, idx) => (
              <Card key={idx} className={`p-4 border ${card.bg} backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">{card.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{card.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* ─── Main content: Channel List + Sidebar ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Channel List (col-span-2) */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 p-4"
                  >
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                    <p className="text-white/70 font-medium mb-1">Failed to load channels</p>
                    <p className="text-white/40 text-sm mb-4">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchChannels}>
                      Retry
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#0C0C0E] rounded-2xl border border-white/[0.06] overflow-hidden"
                  >
                    <ChannelList
                      channels={channels}
                      onToggleChannel={handleToggleChannel}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar: Partner Integrations & Health */}
            <div className="space-y-4">
              {/* Zernio Connect */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-[#0C0C0E] rounded-2xl border border-white/[0.06] p-4"
              >
                <h2 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  Partner Integrations
                </h2>
                <ZernioConnect />
              </motion.div>

              {/* Connection Health */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-[#0C0C0E] rounded-2xl border border-white/[0.06] p-4"
              >
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                  Connection Health
                </h3>
                <div className="space-y-2">
                  {channels.map((ch) => (
                    <div key={ch.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ch.icon className="w-4 h-4" style={{ color: ch.color }} />
                        <span className="text-white/70">{ch.name}</span>
                      </div>
                      {ch.status === "connected" ? (
                        <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      ) : ch.status === "connecting" ? (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                          <Activity className="w-3 h-3 mr-1 animate-pulse" />
                          Connecting
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/10 text-white/30 bg-white/5">
                          <WifiOff className="w-3 h-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-white/20 mt-8"
          >
            Conexiaa AI Communication Bridge — Channel management provides unified monitoring for SMS, Social, and Voice.
          </motion.p>
        </div>
      </div>
    </TooltipProvider>
  );
}