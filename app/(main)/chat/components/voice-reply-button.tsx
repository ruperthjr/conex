"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Loader2, AlertCircle, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
interface VoiceReplyButtonProps {
  messageId: string;
  audioUrl?: string; // direct URL to the generated voice audio
  content?: string; // fallback text to display in title/error context
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: string) => void;
}

type PlayState = "idle" | "loading" | "playing" | "paused" | "error";

// ─── Constants ─────────────────────────────────────────────────────────────
const BUTTON_SIZE = 36; // px
const STROKE_WIDTH = 3;
const CIRCLE_RADIUS = (BUTTON_SIZE - STROKE_WIDTH) / 2;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ─── Component ─────────────────────────────────────────────────────────────
export const VoiceReplyButton = memo(function VoiceReplyButton({
  messageId,
  audioUrl,
  content,
  className,
  onPlay,
  onPause,
  onError,
}: VoiceReplyButtonProps) {
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [progress, setProgress] = useState(0); // 0 to 1
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Cleanup interval ────────────────────────────────────────────────────
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // ─── Cleanup audio on unmount or URL change ──────────────────────────────
  useEffect(() => {
    return () => {
      clearProgressInterval();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, [clearProgressInterval]);

  // ─── Helper to stop audio ────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    clearProgressInterval();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayState("idle");
    setProgress(0);
  }, [clearProgressInterval]);

  // ─── Load and play audio ─────────────────────────────────────────────────
  const startPlayback = useCallback(async () => {
    if (!audioUrl) {
      setErrorMsg("No audio available for this message.");
      setPlayState("error");
      onError?.("No audio URL");
      return;
    }

    // If already playing, pause
    if (playState === "playing") {
      audioRef.current?.pause();
      setPlayState("paused");
      clearProgressInterval();
      onPause?.();
      return;
    }

    // If paused, resume
    if (playState === "paused" && audioRef.current) {
      try {
        await audioRef.current.play();
        setPlayState("playing");
        startProgressTracking();
        onPlay?.();
      } catch (err: any) {
        setErrorMsg(err.message ?? "Playback interrupted");
        setPlayState("error");
        onError?.(err.message ?? "Playback interrupted");
      }
      return;
    }

    // Fresh start: create audio element and load
    setPlayState("loading");
    setErrorMsg(null);

    try {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Events
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("canplaythrough", () => {
        setPlayState("playing");
        startProgressTracking();
        onPlay?.();
        audio.play().catch((err) => {
          setErrorMsg(err.message ?? "Failed to play");
          setPlayState("error");
          onError?.(err.message ?? "Failed to play");
        });
      });

      audio.addEventListener("error", () => {
        setErrorMsg("Audio failed to load. The voice may not be available yet.");
        setPlayState("error");
        onError?.("Audio load error");
      });

      audio.addEventListener("ended", () => {
        stopAudio();
      });

      // Trigger load
      audio.load();
    } catch (err: any) {
      setErrorMsg(err.message ?? "Unexpected error");
      setPlayState("error");
      onError?.(err.message ?? "Unexpected error");
    }
  }, [audioUrl, playState, clearProgressInterval, onPlay, onPause, onError, stopAudio]);

  // ─── Progress tracking ───────────────────────────────────────────────────
  const startProgressTracking = useCallback(() => {
    clearProgressInterval();
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.duration > 0) {
        const pct = audioRef.current.currentTime / audioRef.current.duration;
        setProgress(pct);
      }
    }, 100);
  }, [clearProgressInterval]);

  // ─── Button layout ───────────────────────────────────────────────────────
  const isActive = playState === "playing" || playState === "loading";
  const isLoading = playState === "loading";
  const isError = playState === "error";

  // Ring progress (svg circle)
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <motion.div
      className={cn("flex items-center gap-2", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={startPlayback}
        disabled={isLoading}
        className={cn(
          "relative w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]",
          isError
            ? "bg-red-500/10 border border-red-500/30 text-red-400"
            : isActive
            ? "bg-orange-500/10 border border-orange-500/30 text-orange-400"
            : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/10"
        )}
        title={
          isError
            ? errorMsg ?? "Voice playback error"
            : playState === "playing"
            ? "Pause voice reply"
            : playState === "paused"
            ? "Resume voice reply"
            : "Play voice reply"
        }
        aria-label={
          isError
            ? `Voice playback error: ${errorMsg}`
            : playState === "playing"
            ? "Pause voice reply"
            : "Play voice reply"
        }
      >
        {/* Circular progress ring */}
        {isActive && !isError && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox={`0 0 ${BUTTON_SIZE} ${BUTTON_SIZE}`}
            aria-hidden="true"
          >
            <circle
              cx={BUTTON_SIZE / 2}
              cy={BUTTON_SIZE / 2}
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              className="text-orange-500/30"
            />
            <motion.circle
              cx={BUTTON_SIZE / 2}
              cy={BUTTON_SIZE / 2}
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="#FF6B00"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </svg>
        )}

        {/* Icon */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0, rotate: 0 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
          ) : isError ? (
            <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <AlertCircle className="w-4 h-4" />
            </motion.div>
          ) : playState === "playing" ? (
            <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Pause className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Play className="w-4 h-4 ml-0.5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing ring for "playing" state */}
        {playState === "playing" && (
          <motion.span
            className="absolute inset-0 rounded-full border border-orange-400/40"
            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
          />
        )}
      </button>

      {/* Duration / status label */}
      {isActive && !isError && duration > 0 && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          className="text-[10px] text-white/40 font-mono"
        >
          {Math.floor(duration)}s
        </motion.span>
      )}

      {/* Error message */}
      {isError && errorMsg && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] text-red-400/80 line-clamp-2 max-w-[140px]"
        >
          {errorMsg}
        </motion.span>
      )}

      {/* Fallback label when idle */}
      {playState === "idle" && (
        <span className="text-[10px] text-white/25 flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-orange-400/50" />
          Voice reply
        </span>
      )}
    </motion.div>
  );
});