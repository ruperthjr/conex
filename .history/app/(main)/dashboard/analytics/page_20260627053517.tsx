"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  Wifi,
  RefreshCcw,
} from "lucide-react";

type Channel = "sms" | "social" | "voice";

interface ChannelAnalytics {
  channel: Channel;
  messages: number;
  avg_latency_ms: number;
  engagement_rate: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  messages: number;
}

interface AnalyticsResponse {
  channels: ChannelAnalytics[];
  timeline: TimeSeriesPoint[];
  ai_saves_minutes: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/analytics`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Failed to fetch analytics");

      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalMessages = useMemo(() => {
    if (!data) return 0;
    return data.channels.reduce((acc, c) => acc + c.messages, 0);
  }, [data]);

  const bestChannel = useMemo(() => {
    if (!data) return null;
    return [...data.channels].sort(
      (a, b) => b.engagement_rate - a.engagement_rate
    )[0];
  }, [data]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-orange-500 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics Engine
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time AI communication insights across SMS, Social & Voice
          </p>
        </div>

        <Button
          onClick={fetchAnalytics}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "text-xs",
            loading
              ? "bg-yellow-500"
              : error
              ? "bg-red-500"
              : "bg-green-600"
          )}
        >
          <Wifi className="w-3 h-3 mr-1" />
          {loading
            ? "Loading live analytics..."
            : error
            ? "Error"
            : "Live"}
        </Badge>
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>

      {/* Top Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={totalMessages}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          title="AI Time Saved"
          value={`${data?.ai_saves_minutes ?? 0} min`}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Top Channel"
          value={bestChannel?.channel || "-"}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Channels Active"
          value={data?.channels.length ?? 0}
          icon={<Wifi className="w-5 h-5" />}
        />
      </div>

      {/* Channel Breakdown */}
      <Card className="p-5 border-orange-500/30">
        <h2 className="text-lg font-semibold mb-4 text-orange-500">
          Channel Performance
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {data?.channels.map((c) => (
            <div
              key={c.channel}
              className="rounded-xl border border-orange-500/20 p-4 hover:border-orange-500 transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold uppercase text-sm">
                  {c.channel}
                </span>
                <Badge className="bg-orange-500 text-white text-xs">
                  {c.engagement_rate}%
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                Messages:{" "}
                <span className="text-white font-medium">
                  {c.messages}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Avg Latency:{" "}
                <span className="text-white font-medium">
                  {c.avg_latency_ms} ms
                </span>
              </div>

              {/* Orange bar */}
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{
                    width: `${Math.min(c.engagement_rate, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-5 border-orange-500/30">
        <h2 className="text-lg font-semibold mb-4 text-orange-500">
          Message Flow Timeline
        </h2>

        <div className="w-full h-48 flex items-end gap-1">
          {data?.timeline.map((point, idx) => {
            const max =
              Math.max(...data.timeline.map((p) => p.messages)) || 1;
            const height = (point.messages / max) * 100;

            return (
              <div
                key={idx}
                className="flex-1 bg-orange-500/20 hover:bg-orange-500 transition-all rounded-t-md relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 text-xs bg-black px-2 py-1 rounded">
                  {point.messages}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Demo Trigger */}
      <Card className="p-5 border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-orange-500">
            One-Click Demo Simulation
          </h3>
          <p className="text-sm text-muted-foreground">
            Trigger SMS → AI → Voice pipeline and watch analytics update live.
          </p>
        </div>

        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={async () => {
            try {
              await fetch(`${API_BASE}/ai/demo-simulate`, {
                method: "POST",
              });
              fetchAnalytics();
            } catch (e) {
              console.error(e);
            }
          }}
        >
          Run Simulation
        </Button>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4 border-orange-500/20 hover:border-orange-500 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <h3 className="text-xl font-bold text-orange-500">{value}</h3>
        </div>
        <div className="text-orange-500">{icon}</div>
      </div>
    </Card>
  );
}