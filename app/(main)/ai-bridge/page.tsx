"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Bot,
  Volume2,
  Activity,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────
import { AiSuggestions } from "./components/ai-suggestions";
import { ElevenLabsPlayer } from "./components/elevenlabs-player";

// ─── UI Primitives (Shadcn/UI) ───────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────
export type AIServiceStatus = "connected" | "disconnected" | "loading" | "error";

export interface AIService {
  name: string;
  model: string;
  status: AIServiceStatus;
  icon: React.ElementType;
  color: string;
}

// ─── Mock service status (replace with real API later) ────────────────────
const initialAIServices: AIService[] = [
  {
    name: "Featherless AI",
    model: "deepseek-r1",
    status: "disconnected",
    icon: Bot,
    color: "#FF6B00",
  },
  {
    name: "ElevenLabs TTS",
    model: "v3-turbo",
    status: "disconnected",
    icon: Volume2,
    color: "#0EA5E9",
  },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function AibridgePage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [services, setServices] = useState<AIService[]>(initialAIServices);
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>("");

  // ── Handlers ────────────────────────────────────────────────────────────
  const updateServiceStatus = useCallback(
    (serviceName: string, newStatus: AIServiceStatus) => {
      setServices((prev) =>
        prev.map((s) => (s.name === serviceName ? { ...s, status: newStatus } : s))
      );
    },
    []
  );

  const connectService = useCallback(
    async (serviceName: string) => {
      updateServiceStatus(serviceName, "loading");
      // Simulate connection delay — replace with real API calls
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // In a real app, call backend to check service health
      updateServiceStatus(serviceName, "connected");
    },
    [updateServiceStatus]
  );

  const disconnectService = useCallback(
    async (serviceName: string) => {
      updateServiceStatus(serviceName, "loading");
      await new Promise((resolve) => setTimeout(resolve, 600));
      updateServiceStatus(serviceName, "disconnected");
    },
    [updateServiceStatus]
  );

  // ── AI Generation ───────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setAiResponse(null);
    setVoiceUrl(null);

    // Simulate Featherless AI + RAG
    try {
      // In production: fetch POST /api/v1/ai/generate
      await new Promise((r) => setTimeout(r, 1800));
      const simulatedText = `Based on your query "${prompt.slice(0, 40)}", our AI recommends: ... `;
      setAiResponse(simulatedText);
      setLastAction("Featherless response generated");

      // Simulate ElevenLabs TTS
      await new Promise((r) => setTimeout(r, 1500));
      // In production, voiceUrl would be returned from the backend
      setVoiceUrl("/demo/voice-summary.mp3");
      setLastAction("Voice ready — tap play below");
    } catch (err: any) {
      setErrorMsg(err.message || "AI generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  // ── Featherless model list for suggestions ──────────────────────────────
  const featherlessModels = useMemo(
    () => ["deepseek-r1", "qwen2.5-7b", "llama-3-8b"],
    []
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-[#09090B] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                AI Bridge
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Test Featherless AI models and ElevenLabs voice synthesis in one place
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                onClick={() => {
                  setPrompt("");
                  setAiResponse(null);
                  setVoiceUrl(null);
                  setErrorMsg(null);
                }}
              >
                Clear
              </Button>
            </div>
          </motion.div>

          {/* Service Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {services.map((service) => {
              const Icon = service.icon;
              const isConnected = service.status === "connected";
              const isLoading = service.status === "loading";
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4 border border-white/[0.06] bg-[#0C0C0E]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${service.color}18` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: service.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/80">{service.name}</p>
                          <p className="text-[10px] text-white/35">{service.model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            <Wifi className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        ) : isLoading ? (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Connecting
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-white/10 text-white/30">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                        {isConnected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectService(service.name)}
                            disabled={isLoading}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => connectService(service.name)}
                            disabled={isLoading}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Main interaction area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Input & Suggestions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Prompt Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="p-4 border border-white/[0.06] bg-[#0C0C0E]">
                  <h2 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    Generate AI Response
                  </h2>
                  <div className="flex items-center gap-2">
                    <Input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter a message for the AI to process..."
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:border-orange-500/40"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/25"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Error message */}
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400 flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {errorMsg}
                    </motion.div>
                  )}
                </Card>
              </motion.div>

              {/* Featherless AI Suggestions */}
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <AiSuggestions
                    text={prompt}
                    response={aiResponse}
                    models={featherlessModels}
                    isLoading={isGenerating && !aiResponse}
                  />
                </motion.div>
              )}

              {/* ElevenLabs Voice Player */}
              {voiceUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <ElevenLabsPlayer audioUrl={voiceUrl} text={aiResponse || ""} />
                </motion.div>
              )}
            </div>

            {/* Right column: Info & Stats */}
            <div className="space-y-4">
              {/* Last Action */}
              <Card className="p-4 border border-white/[0.06] bg-[#0C0C0E]">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                  Last Activity
                </h3>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white/70">
                    {lastAction || "No activity yet"}
                  </span>
                </div>
              </Card>

              {/* API endpoint info */}
              <Card className="p-4 border border-white/[0.06] bg-[#0C0C0E]">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                  API Endpoints
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-white/50">
                    <span>Featherless</span>
                    <span className="text-orange-400">/api/v1/ai/featherless</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>ElevenLabs</span>
                    <span className="text-sky-400">/api/v1/ai/elevenlabs</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>RAG</span>
                    <span className="text-purple-400">/api/v1/ai/rag</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-white/20 mt-8"
          >
            Conexiaa AI Bridge — Seamlessly test and integrate Featherless AI models and ElevenLabs TTS.
          </motion.p>
        </div>
      </div>
    </TooltipProvider>
  );
}