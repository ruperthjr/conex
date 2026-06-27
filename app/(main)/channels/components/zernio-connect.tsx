"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Link,
  Unlink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── UI Primitives (Shadcn/UI) ──────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ──────────────────────────────────────────────────────────────
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ZernioConnectProps {
  className?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
}

// ─── Configuration (env‑based in production) ────────────────────────────
const ZERNIO_CONNECT_URL =
  process.env.NEXT_PUBLIC_ZERNIO_CONNECT_URL ||
  "http://localhost:8000/api/v1/channels/zernio/connect";

const ZERNIO_DISCONNECT_URL =
  process.env.NEXT_PUBLIC_ZERNIO_DISCONNECT_URL ||
  "http://localhost:8000/api/v1/channels/zernio/disconnect";

// ─── Component ──────────────────────────────────────────────────────────
export function ZernioConnect({ className, onStatusChange }: ZernioConnectProps) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Handle connect / disconnect toggle ──────────────────────────────────
  const handleToggle = useCallback(async () => {
    setErrorMessage(null);

    if (status === "connected") {
      // Disconnect
      setStatus("connecting");
      onStatusChange?.("connecting");
      try {
        const res = await fetch(ZERNIO_DISCONNECT_URL, { method: "POST" });
        if (!res.ok) throw new Error(`Disconnect failed (${res.status})`);
        setStatus("disconnected");
        onStatusChange?.("disconnected");
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to disconnect");
        setStatus("error");
        onStatusChange?.("error");
      }
      return;
    }

    // Connect flow
    setStatus("connecting");
    onStatusChange?.("connecting");

    try {
      const res = await fetch(ZERNIO_CONNECT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // In a real app you'd send credentials / OAuth code
          platform: "twitter", // placeholder
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Connection failed (${res.status})`);
      }

      setStatus("connected");
      onStatusChange?.("connected");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to Zernio");
      setStatus("error");
      onStatusChange?.("error");
    }
  }, [status, onStatusChange]);

  // ── Render ──────────────────────────────────────────────────────────────
  const isBusy = status === "connecting";

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("space-y-3", className)}>
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 font-medium">Zernio Integration</span>
          <ConnectionStatusBadge status={status} />
          {status === "error" && errorMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="w-3.5 h-3.5 text-red-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                {errorMessage}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Action button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleToggle}
            disabled={isBusy}
            variant={status === "connected" ? "outline" : "default"}
            className={cn(
              "w-full justify-start gap-2 h-10 text-sm font-semibold transition-all",
              status === "disconnected" &&
                "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-600/20 hover:shadow-purple-600/30",
              status === "connected" &&
                "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20",
              status === "error" &&
                "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20",
              isBusy && "opacity-80 cursor-wait"
            )}
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === "connected" ? (
              <Unlink className="w-4 h-4" />
            ) : status === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            <span>
              {isBusy
                ? "Connecting..."
                : status === "connected"
                ? "Disconnect Zernio"
                : status === "error"
                ? "Retry Connection"
                : "Connect Zernio"}
            </span>
            {status !== "connected" && !isBusy && (
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
            )}
          </Button>
        </motion.div>

        {/* Helper text */}
        <p className="text-[10px] text-white/25 leading-relaxed">
          Zernio aggregates Twitter, Instagram, and Facebook conversations into a unified inbox.
          Connect to read and reply across social platforms.
        </p>
      </div>
    </TooltipProvider>
  );
}

// ─── Small status badge sub‑component ─────────────────────────────────────
function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case "connected":
      return (
        <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case "connecting":
      return (
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    case "disconnected":
    default:
      return (
        <Badge variant="outline" className="border-white/10 text-white/30 bg-white/5">
          <Link className="w-3 h-3 mr-1" />
          Offline
        </Badge>
      );
  }
}