"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Bot,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── UI Primitives ────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────
interface AiSuggestionsProps {
  /** The original user prompt used to generate the initial response */
  text: string;
  /** The initial AI response displayed */
  response: string;
  /** Available Featherless model names (e.g. ["deepseek-r1", "qwen2.5-7b"]) */
  models: string[];
  /** When true, shows a skeleton / spinner (initial generation in progress) */
  isLoading?: boolean;
  /** Optional callback when a new model generates a response */
  onResponseUpdate?: (newResponse: string, model: string) => void;
  /** Additional class names */
  className?: string;
}

// ─── Configuration (env‑based) ───────────────────────────────────────────
const FEATHERLESS_API_URL =
  process.env.NEXT_PUBLIC_FEATHERLESS_API_URL ||
  "http://localhost:8000/api/v1/ai/featherless";

// ─── Component ────────────────────────────────────────────────────────────
export function AiSuggestions({
  text,
  response,
  models,
  isLoading = false,
  onResponseUpdate,
  className,
}: AiSuggestionsProps) {
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-r1");
  const [localResponse, setLocalResponse] = useState<string>(response);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when parent response changes
  React.useEffect(() => {
    setLocalResponse(response);
  }, [response]);

  // Handle model selection
  const handleModelSelect = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  // Regenerate with selected model
  const handleRegenerate = useCallback(async () => {
    if (!text.trim() || generating) return;
    setGenerating(true);
    setError(null);

    try {
      // In production, replace with a real API call to featherless_service
      const res = await fetch(FEATHERLESS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, model: selectedModel }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      const newResponse = data.response ?? data.text ?? "";
      setLocalResponse(newResponse);
      onResponseUpdate?.(newResponse, selectedModel);
    } catch (err: unknown) {
      // Demo fallback for offline / demo mode
      const fallback = `[Featherless demo] Using model "${selectedModel}", your query about "${text.slice(0, 30)}" would receive a tailored response here.`;
      setLocalResponse(fallback);
      onResponseUpdate?.(fallback, selectedModel);
      // If not in demo mode, show error
      if (!process.env.NEXT_PUBLIC_DEMO_MODE) {
        setError(err instanceof Error ? err.message : "Failed to reach Featherless AI");
      }
    } finally {
      setGenerating(false);
    }
  }, [text, selectedModel, generating, onResponseUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      <Card className="border border-white/[0.06] bg-[#0C0C0E] p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-sm font-semibold text-white/80">
            Featherless AI Suggestions
          </h3>
          {!isLoading && !generating && (
            <Badge variant="outline" className="ml-auto border-orange-500/30 text-orange-400">
              <Sparkles className="w-3 h-3 mr-1" />
              AI powered
            </Badge>
          )}
        </div>

        {/* Loading state (external) */}
        {isLoading && (
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
            <span className="text-sm text-white/50">Generating initial response...</span>
          </div>
        )}

        {/* Display response (if not loading externally) */}
        {!isLoading && (
          <>
            <div className="relative">
              <motion.div
                key={localResponse}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {localResponse}
                </p>
              </motion.div>

              {/* Regenerate indicator (in‑progress) */}
              {generating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px] rounded-xl flex items-center justify-center"
                >
                  <div className="flex items-center gap-2 bg-[#101012] px-3 py-2 rounded-full border border-white/10">
                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                    <span className="text-xs text-white/60">Regenerating with {selectedModel}...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Model selection */}
            <div className="mt-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">
                Choose model for new response
              </p>
              <div className="flex flex-wrap gap-2">
                {models.map((model) => {
                  const isSelected = selectedModel === model;
                  return (
                    <motion.button
                      key={model}
                      onClick={() => handleModelSelect(model)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                        isSelected
                          ? "bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-sm shadow-orange-500/10"
                          : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white/90 hover:border-white/20"
                      )}
                    >
                      {model}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Regenerate button */}
            <div className="mt-3">
              <Button
                onClick={handleRegenerate}
                disabled={generating || !text.trim()}
                className={cn(
                  "w-full h-9 text-sm font-semibold",
                  "bg-gradient-to-r from-orange-600 to-orange-500 text-white",
                  "shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30",
                  "transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Zap className="w-4 h-4 mr-1.5" />
                )}
                Regenerate with {selectedModel}
                {!generating && <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
}