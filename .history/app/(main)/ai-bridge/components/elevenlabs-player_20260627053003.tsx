"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Download,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── UI Primitives (Shadcn/UI) ──────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ──────────────────────────────────────────────────────────────
interface ElevenLabsPlayerProps {
  /** URL of the generated audio file (MP3/WAV) */
  audioUrl: string;
  /** Optional transcript or description of the audio content */
  text?: string;
  /** Additional CSS class */
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────
const ORANGE = "#FF6B00";

// ─── Helper: format seconds to mm:ss ─────────────────────────────────────
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// ─── Component ───────────────────────────────────────────────────────────
export const ElevenLabsPlayer = memo(function ElevenLabsPlayer({
  audioUrl,
  text,
  className,
}: ElevenLabsPlayerProps) {
  // ── Refs ────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── State ───────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  const progress = duration > 0 ? currentTime / duration : 0;

  // ── Cleanup interval ────────────────────────────────────────────────────
  const clearProgressInterval = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // ── Initialize audio element ────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.preload = "auto";
    queueMicrotask(() => {
      setIsLoading(true);
      setError(null);
    });

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
      }
    };

    const onError = () => {
      setError("Failed to load audio. The voice file may be unavailable.");
      setIsLoading(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    // Cleanup
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
      clearProgressInterval();
    };
  }, [audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync volume/mute ────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ── Progress tracking when playing ──────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 200);
    } else {
      clearProgressInterval();
    }
    return clearProgressInterval;
  }, [isPlaying, clearProgressInterval]);

  // ── Play/Pause ──────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || error) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        setError("Playback failed. Try again.");
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, error]);

  // ── Seek (from slider) ──────────────────────────────────────────────────
  const handleSeek = useCallback(
    (value: number[]) => {
      if (audioRef.current && duration > 0) {
        const newTime = value[0] * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration]
  );

  // ── Volume change ──────────────────────────────────────────────────────
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVol = value[0];
      setVolume(newVol);
      if (newVol === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted]
  );

  // ── Toggle mute ────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // ── Skip forward/backward ──────────────────────────────────────────────
  const handleSkipBack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleSkipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        duration,
        audioRef.current.currentTime + 10
      );
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [duration]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-2xl border border-white/[0.06] bg-[#0C0C0E] p-4 shadow-lg",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center">
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <h3 className="text-sm font-semibold text-white/80">
            ElevenLabs Voice
          </h3>
          <Badge className="ml-auto text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">
            <Zap className="w-3 h-3 mr-1" />
            v3-turbo
          </Badge>
        </div>

        {/* Transcript snippet (if provided) */}
        {text && (
          <p className="text-xs text-white/50 italic leading-relaxed mb-3 line-clamp-2">
            “{text.slice(0, 120)}{text.length > 120 ? "…" : ""}”
          </p>
        )}

        {/* Loading / Error states */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-4 justify-center"
            >
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
              <span className="text-sm text-white/50">Loading audio...</span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  // Force reload by reassigning same URL? We'll recreate audio.
                  if (audioRef.current) {
                    audioRef.current.load();
                  }
                }}
              >
                Retry
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 w-8 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[progress]}
                  max={1}
                  step={0.001}
                  onValueChange={handleSeek}
                  className="flex-1"
                  trackClassName="bg-white/10 h-1.5"
                  rangeClassName="bg-sky-500 h-1.5"
                  thumbClassName="h-3.5 w-3.5 bg-white border-2 border-sky-500 shadow-md"
                />
                <span className="text-[10px] text-white/40 w-8 text-left font-mono">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                        onClick={handleSkipBack}
                        aria-label="Skip back 10 seconds"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Skip back 10s</TooltipContent>
                  </Tooltip>

                  {/* Play/Pause */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={handlePlayPause}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors",
                      "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/30"
                    )}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </motion.button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                        onClick={handleSkipForward}
                        aria-label="Skip forward 10 seconds"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Skip forward 10s</TooltipContent>
                  </Tooltip>
                </div>

                {/* Volume control */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                  </Tooltip>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                    trackClassName="bg-white/10 h-1"
                    rangeClassName="bg-sky-500 h-1"
                    thumbClassName="h-3 w-3 bg-white border border-sky-500 shadow"
                  />
                </div>
              </div>

              {/* Extra actions */}
              <div className="flex items-center justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-white/30 hover:text-white/70"
                      asChild
                    >
                      <a href={audioUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download audio file</TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
});

// ─── Badge component (inline to avoid extra import if not needed) ────────
const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
      className
    )}
  >
    {children}
  </span>
);