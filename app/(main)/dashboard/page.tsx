"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: number;
  suffix?: string;
  change: number;
};

type ChannelStat = {
  name: string;
  color: string;
  usage: number;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Messages Processed", value: 12450, change: 12 },
    { label: "AI Responses", value: 11820, change: 9 },
    { label: "Avg Latency", value: 1.2, suffix: "s", change: -18 },
    { label: "Time Saved", value: 320, suffix: "hrs", change: 22 },
  ]);

  const [channels, setChannels] = useState<ChannelStat[]>([
    { name: "SMS", color: "bg-blue-400", usage: 35 },
    { name: "Social", color: "bg-purple-400", usage: 40 },
    { name: "Voice", color: "bg-green-400", usage: 25 },
  ]);

  const [loading, setLoading] = useState(true);

  // Simulate realtime updates
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);

    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          value:
            typeof m.value === "number"
              ? parseFloat((m.value + Math.random() * 10).toFixed(2))
              : m.value,
        }))
      );
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8 fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            AI Command Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time insights across SMS, social, and voice channels.
          </p>
        </div>

        <Link href="/dashboard/analytics">
          <Button className="btn-orange glow-orange">
            📊 Deep Analytics
          </Button>
        </Link>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card
            key={i}
            className="p-4 glass border-glow relative overflow-hidden"
          >
            <div className="text-xs text-muted-foreground">
              {metric.label}
            </div>

            {loading ? (
              <div className="mt-2 h-6 w-20 shimmer rounded" />
            ) : (
              <div className="mt-2 text-xl font-semibold">
                {metric.value}
                {metric.suffix && (
                  <span className="text-sm ml-1 text-muted-foreground">
                    {metric.suffix}
                  </span>
                )}
              </div>
            )}

            <div
              className={cn(
                "text-xs mt-1",
                metric.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              )}
            >
              {metric.change >= 0 ? "↑" : "↓"} {Math.abs(metric.change)}%
            </div>

            {/* subtle glow */}
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-[#FF6B00]/10 blur-2xl rounded-full" />
          </Card>
        ))}
      </div>

      {/* CHANNEL DISTRIBUTION */}
      <Card className="p-5 glass border-glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Channel Usage Distribution
          </h2>
          <span className="text-xs text-muted-foreground">
            Live traffic split
          </span>
        </div>

        <div className="space-y-4">
          {channels.map((channel, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span>{channel.name}</span>
                <span>{channel.usage}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    channel.color
                  )}
                  style={{ width: `${channel.usage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* LIVE ACTIVITY */}
      <Card className="p-5 glass border-glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Live AI Activity Stream
          </h2>
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Streaming
          </span>
        </div>

        <div className="space-y-3 text-xs max-h-[200px] overflow-auto pr-2">
          {activityLogs.map((log, i) => (
            <div
              key={i}
              className="flex items-start justify-between bg-white/5 px-3 py-2 rounded-md fade-in"
            >
              <span>{log.text}</span>
              <span className="text-muted-foreground">
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA PANEL */}
      <div className="flex flex-col md:flex-row gap-4">
        <Link href="/chat" className="flex-1">
          <Card className="p-5 glass border-glow hover:scale-[1.02] transition">
            <h3 className="font-semibold text-sm mb-1">
              💬 Open Unified Chat
            </h3>
            <p className="text-xs text-muted-foreground">
              Experience real-time AI messaging across all channels.
            </p>
          </Card>
        </Link>

        <Link href="/ai-bridge" className="flex-1">
          <Card className="p-5 glass border-glow hover:scale-[1.02] transition">
            <h3 className="font-semibold text-sm mb-1">
              🎙️ AI Voice Bridge
            </h3>
            <p className="text-xs text-muted-foreground">
              Trigger voice synthesis and intelligent routing.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

/* =========================
   STATIC ACTIVITY STREAM
========================= */
const activityLogs = [
  { text: "SMS received → AI processing", time: "2s ago" },
  { text: "RAG context retrieved from vector DB", time: "5s ago" },
  { text: "Voice reply generated (ElevenLabs)", time: "8s ago" },
  { text: "Social message synced via Zernio", time: "12s ago" },
  { text: "AI routed conversation to correct channel", time: "15s ago" },
];