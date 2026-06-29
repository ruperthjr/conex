"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Phone,
  Share2,
  Wifi,
  Play,
  Sparkles,
  Activity,
  Zap,
  Bot,
  Search,
  Bell,
  Settings,
  Plus,
  X,
  Menu,
  Send,
  Clock,
  TrendingUp,
  Database,
  Radio,
  Layers,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ─── Chat Sub-Components (./components/*) ───────────────────────────────────
import { ChatThread } from "./components/chat-thread";
import { MessageBubble } from "./components/message-bubble";
import { ChannelSwitcher } from "./components/channel-switcher";
import { RagContextHighlight } from "./components/rag-context-highlight";
import { VoiceReplyButton } from "./components/voice-reply-button";
import { TypingIndicator } from "./components/typing-indicator";
import { MultiChannelIndicator } from "./components/multi-channel-indicator";

// ─── Shared UI (components/ui/*) ────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────
export type Channel = "sms" | "social" | "voice";
export type MessageRole = "user" | "assistant" | "system";
export type WSEventKind =
  | "message"
  | "typing"
  | "rag_context"
  | "ai_status"
  | "channel_switch";
export type AIStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "voice_generating"
  | "error";

export interface RagContext {
  id: string;
  content: string;
  similarity: number;
  source: string;
  channel: Channel;
  dataset: string;
}

export interface MessageMetadata {
  model?: string;
  latency?: number;
  tokens?: number;
  ragHits?: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  channel: Channel;
  timestamp: Date;
  ragContexts?: RagContext[];
  audioUrl?: string;
  isStreaming?: boolean;
  isVoiceReady?: boolean;
  metadata?: MessageMetadata;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  socialHandle?: string;
  email?: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  channel: Channel;
  unreadCount: number;
  updatedAt: Date;
  contact: Contact;
  messages: Message[];
}

export interface WSPayload {
  event: WSEventKind;
  data: Record<string, unknown>;
  conversationId?: string;
}

export interface AIStatusInfo {
  status: AIStatus;
  model?: string;
  stage?: string;
  progress?: number;
}

export interface ChannelCfg {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
}

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────
export const CHANNEL_CONFIG: Record<Channel, ChannelCfg> = {
  sms: {
    label: "SMS",
    color: "#FF6B00",
    bgClass: "bg-orange-500",
    textClass: "text-orange-400",
    borderClass: "border-orange-500",
    icon: MessageSquare,
    gradientFrom: "from-orange-600",
    gradientTo: "to-orange-400",
  },
  social: {
    label: "Social",
    color: "#7C3AED",
    bgClass: "bg-purple-600",
    textClass: "text-purple-400",
    borderClass: "border-purple-500",
    icon: Share2,
    gradientFrom: "from-purple-700",
    gradientTo: "to-purple-400",
  },
  voice: {
    label: "Voice",
    color: "#0EA5E9",
    bgClass: "bg-sky-500",
    textClass: "text-sky-400",
    borderClass: "border-sky-500",
    icon: Phone,
    gradientFrom: "from-sky-600",
    gradientTo: "to-sky-400",
  },
};

const WS_RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

// ────────────────────────────────────────────────────────────────────────────
// DEMO DATA
// ────────────────────────────────────────────────────────────────────────────
const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    title: "Sarah Mitchell",
    lastMessage: "Can you help me reset my account password?",
    channel: "sms",
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 120_000),
    contact: { id: "u1", name: "Sarah Mitchell", phone: "+1 (555) 234-5678", socialHandle: "@sarah_m" },
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Hi, I can't log into my account. I think I forgot my password.",
        channel: "sms",
        timestamp: new Date(Date.now() - 300_000),
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Hi Sarah! I can help you reset your password right away. I've found your account using your registered phone number. Would you like me to send a reset link via SMS or email?",
        channel: "sms",
        timestamp: new Date(Date.now() - 280_000),
        isVoiceReady: true,
        ragContexts: [
          {
            id: "r1",
            content:
              "Password reset flow requires identity verification via the registered contact method before issuing a new credential.",
            similarity: 0.94,
            source: "customer_support_conversations/dataset.csv",
            channel: "sms",
            dataset: "Kaggle: Customer Support",
          },
        ],
        metadata: { model: "featherless/deepseek-r1", latency: 842, tokens: 87, ragHits: 3 },
      },
      {
        id: "m3",
        role: "user",
        content: "Please send it to my email. Also, can you help me reset my account password?",
        channel: "sms",
        timestamp: new Date(Date.now() - 250_000),
      },
    ],
  },
  {
    id: "conv-2",
    title: "Alex Torres",
    lastMessage: "Your issue has been escalated to our team.",
    channel: "social",
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 3_600_000),
    contact: { id: "u2", name: "Alex Torres", socialHandle: "@alex_torres" },
    messages: [
      {
        id: "m4",
        role: "user",
        content: "Hey @support my order #45892 hasn't arrived and it's been 2 weeks!",
        channel: "social",
        timestamp: new Date(Date.now() - 7_200_000),
      },
      {
        id: "m5",
        role: "assistant",
        content:
          "@alex_torres — really sorry about the delay! I checked order #45892 and it has been flagged in our logistics system. Your issue has been escalated and you'll receive a resolution within 24 hours. A $10 credit has been applied to your account.",
        channel: "social",
        timestamp: new Date(Date.now() - 7_100_000),
        isVoiceReady: true,
        ragContexts: [
          {
            id: "r2",
            content:
              "Late orders exceeding 10 business days automatically qualify for escalation and refund review per SLA policy v2.",
            similarity: 0.91,
            source: "customer_support_on_twitter/replies.csv",
            channel: "social",
            dataset: "Kaggle: Twitter Customer Support",
          },
        ],
        metadata: { model: "featherless/deepseek-r1", latency: 1203, tokens: 112, ragHits: 5 },
      },
    ],
  },
  {
    id: "conv-3",
    title: "James Patel",
    lastMessage: "[Voice] 'I need to upgrade my plan…'",
    channel: "voice",
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1_800_000),
    contact: { id: "u3", name: "James Patel", phone: "+1 (555) 987-6543" },
    messages: [
      {
        id: "m6",
        role: "user",
        content: "[Voice Transcript] I need to upgrade my plan to enterprise tier. I've been a customer for 3 years.",
        channel: "voice",
        timestamp: new Date(Date.now() - 1_800_000),
      },
      {
        id: "m7",
        role: "assistant",
        content:
          "James, thank you for 3 years of loyalty! Based on your usage, I recommend Enterprise Pro — unlimited API calls, dedicated support, custom SLA. I'm generating a personalised contract now and can send it via email. Shall I proceed?",
        channel: "voice",
        timestamp: new Date(Date.now() - 1_750_000),
        isVoiceReady: true,
        audioUrl: "/demo/voice-reply-james.mp3",
        ragContexts: [
          {
            id: "r3",
            content:
              "Long-term customers (>2 years) qualify for 20% loyalty discounts on enterprise-tier upgrades under retention policy.",
            similarity: 0.89,
            source: "multi_platform_dialogues/dialogues.jsonl",
            channel: "voice",
            dataset: "Multi-Platform Dialogues",
          },
        ],
        metadata: { model: "featherless/deepseek-r1", latency: 967, tokens: 98, ragHits: 4 },
      },
    ],
  },
  {
    id: "conv-demo",
    title: "Maya Chen",
    lastMessage: "Start demo to see full AI flow →",
    channel: "sms",
    unreadCount: 3,
    updatedAt: new Date(),
    contact: { id: "u4", name: "Maya Chen", phone: "+1 (555) 321-0987", socialHandle: "@maya_chen_dev" },
    messages: [],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// DEMO SIMULATION SCRIPT
// ────────────────────────────────────────────────────────────────────────────
type DemoStepType =
  | "user_message"
  | "ai_thinking"
  | "rag_retrieval"
  | "ai_response"
  | "channel_switch"
  | "voice_generating"
  | "voice_ready";

interface DemoStep {
  delay: number;
  type: DemoStepType;
  channel: Channel;
  content: string;
}

const DEMO_SCRIPT: DemoStep[] = [
  { delay: 0,     type: "user_message",   channel: "sms",    content: "I need urgent help! My card was charged twice this month — $49.99 on June 1st AND June 15th." },
  { delay: 1100,  type: "ai_thinking",    channel: "sms",    content: "" },
  { delay: 2400,  type: "rag_retrieval",  channel: "sms",    content: "" },
  { delay: 4000,  type: "ai_response",    channel: "sms",    content: "I understand this is urgent, Maya! I've verified both transactions — June 1st ($49.99) is valid, but June 15th is a billing error. I'm initiating a full refund of $49.99 right now, plus a $10 credit for the inconvenience. Refund arrives in 3–5 business days." },
  { delay: 5600,  type: "channel_switch", channel: "social", content: "" },
  { delay: 6400,  type: "user_message",   channel: "social", content: "@support Just DM'd you about a double charge. Any update? This is frustrating 😤" },
  { delay: 7400,  type: "ai_thinking",    channel: "social", content: "" },
  { delay: 9000,  type: "ai_response",    channel: "social", content: "@maya_chen_dev Already resolved! Your $49.99 refund is processing + we added a $10 credit as an apology 🙏 You'll see both in 3–5 days. Thanks for your patience — we've escalated billing QA to prevent this." },
  { delay: 10800, type: "voice_generating", channel: "voice", content: "" },
  { delay: 12500, type: "voice_ready",    channel: "voice",  content: "[Voice Summary Ready] Your account issue has been resolved across SMS and Social. Tap the play button to hear your personalised account update via ElevenLabs." },
];

// ────────────────────────────────────────────────────────────────────────────
// WEBSOCKET HOOK
// ────────────────────────────────────────────────────────────────────────────
function useConexiaaWS(url: string, conversationId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSPayload | null>(null);

  const connect = useCallback(() => {
    if (!conversationId) return;
    try {
      const ws = new WebSocket(`${url}/${conversationId}`);
      wsRef.current = ws;
      ws.onopen = () => { setIsConnected(true); retryRef.current = 0; };
      ws.onmessage = (e: MessageEvent) => {
        try { setLastEvent(JSON.parse(e.data) as WSPayload); } catch { /* ignore */ }
      };
      ws.onclose = () => {
        setIsConnected(false);
        const delay = WS_RECONNECT_DELAYS[Math.min(retryRef.current++, 3)];
        timerRef.current = setTimeout(() => connectRef.current(), delay);
      };
      ws.onerror = () => ws.close();
    } catch {
      setIsConnected(false);
    }
  }, [url, conversationId]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const send = useCallback((payload: WSPayload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    const id = setTimeout(connect, 0);
    return () => {
      clearTimeout(id);
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, lastEvent, send };
}

// ────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────────────────────────
function formatTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

function mockAIResponse(input: string, channel: Channel): string {
  const trim = input.slice(0, 32);
  const map: Record<Channel, string> = {
    sms: `Got your message about "${trim}…". I've reviewed your account and can resolve this immediately. Your case is now Priority 1 — expect a resolution in under 5 minutes. Is there anything else I can help with?`,
    social: `Hey! 👋 Saw your message about "${trim}…" — on it right now! Our AI pulled relevant context from 3 similar cases. You'll have a personalised resolution in moments. Thanks for reaching out!`,
    voice: `[Voice Response] Thank you for calling. Regarding "${trim}…" — I've reviewed your full account profile and usage history. I'm ready to provide a personalised solution tailored specifically to your needs. Would you like me to proceed?`,
  };
  return map[channel];
}

// ────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ────────────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>("conv-demo");
  const [activeChannel, setActiveChannel] = useState<Channel>("sms");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatusInfo>({ status: "idle" });
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoProgress, setDemoProgress] = useState(-1);
  const [ragPanelOpen, setRagPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [activeRagContexts, setActiveRagContexts] = useState<RagContext[]>([]);
  const [statsOpen, setStatsOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"all" | Channel>("all");

  const inputRef = useRef<HTMLInputElement>(null);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/chat";
  const { isConnected, lastEvent, send } = useConexiaaWS(WS_URL, activeConvId);

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId),
    [conversations, activeConvId]
  );

  const filteredConvs = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch =
        c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      const matchChannel = channelFilter === "all" || c.channel === channelFilter;
      return matchSearch && matchChannel;
    });
  }, [conversations, searchQuery, channelFilter]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addMessage = useCallback((convId: string, msg: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, msg],
              lastMessage: msg.content.slice(0, 70) + (msg.content.length > 70 ? "…" : ""),
              updatedAt: new Date(),
            }
          : c
      )
    );
  }, []);

  const patchLastMsg = useCallback(
    (convId: string, updater: (m: Message) => Message) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: c.messages.map((m, i) => (i === c.messages.length - 1 ? updater(m) : m)) }
            : c
        )
      );
    },
    []
  );

  // ── WS Events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lastEvent) return;
    const ev = lastEvent;
    const t = setTimeout(() => {
      if (ev.event === "typing")
        setIsTyping(Boolean((ev.data as { isTyping?: boolean })?.isTyping));
      if (ev.event === "rag_context")
        setActiveRagContexts(((ev.data as { contexts?: RagContext[] })?.contexts as RagContext[]) ?? []);
      if (ev.event === "ai_status") setAiStatus(ev.data as unknown as AIStatusInfo);
      if (ev.event === "message") {
        const msg = ev.data as unknown as Message;
        addMessage(ev.conversationId ?? activeConvId, {
          ...msg,
          timestamp: new Date(msg.timestamp),
        });
      }
    }, 0);

    return () => clearTimeout(t);
  }, [lastEvent, addMessage, activeConvId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearDemoTimers = useCallback(() => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
  }, []);

  // ── Simulate AI Response (fallback when no backend) ───────────────────────
  const simulateAI = useCallback(
    (userContent: string, channel: Channel, convId: string) => {
      const rag: RagContext = {
        id: `rag-${Date.now()}`,
        content: `Context matched for: "${userContent.slice(0, 40)}…" — retrieved from support knowledge base.`,
        similarity: 0.87 + Math.random() * 0.1,
        source: "customer_support_conversations/dataset.csv",
        channel,
        dataset: "Kaggle: Customer Support",
      };

      const t1 = setTimeout(() => {
        setAiStatus({ status: "thinking", stage: "Retrieving RAG context…", progress: 35 });
        setActiveRagContexts([rag]);
      }, 900);

      const t2 = setTimeout(() => {
        setAiStatus({ status: "streaming", stage: "Streaming response…", progress: 75 });
        setIsTyping(false);

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: "",
          channel,
          timestamp: new Date(),
          ragContexts: [rag],
          isStreaming: true,
          metadata: { model: "featherless/deepseek-r1" },
        };
        addMessage(convId, aiMsg);

        const full = mockAIResponse(userContent, channel);
        let cursor = 0;
        const stream = setInterval(() => {
          cursor = Math.min(cursor + 9, full.length);
          patchLastMsg(convId, (m) => ({ ...m, content: full.slice(0, cursor), isStreaming: cursor < full.length }));
          if (cursor >= full.length) {
            clearInterval(stream);
            setAiStatus({ status: "voice_generating", stage: "ElevenLabs TTS…", progress: 92 });
            const t3 = setTimeout(() => {
              patchLastMsg(convId, (m) => ({
                ...m,
                isStreaming: false,
                isVoiceReady: true,
                metadata: { ...m.metadata, latency: 800 + Math.floor(Math.random() * 500), tokens: Math.ceil(full.length / 4), ragHits: 3 },
              }));
              setAiStatus({ status: "idle" });
            }, 1400);
            demoTimersRef.current.push(t3);
          }
        }, 38);
      }, 1700);

      demoTimersRef.current.push(t1, t2);
    },
    [addMessage, patchLastMsg]
  );

  // ── Send Message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (content: string, channel: Channel = activeChannel) => {
      if (!content.trim() || !activeConvId) return;
      const msg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
        channel,
        timestamp: new Date(),
      };
      addMessage(activeConvId, msg);
      setInputValue("");
      setIsTyping(true);
      setAiStatus({ status: "thinking", stage: "Analysing intent…", progress: 15 });
      send({ event: "message", conversationId: activeConvId, data: { content: content.trim(), channel } });
      if (!isConnected || demoMode) simulateAI(content, channel, activeConvId);
    },
    [activeChannel, activeConvId, addMessage, send, isConnected, demoMode, simulateAI]
  );

  // ── One-Click Demo ────────────────────────────────────────────────────────
  const runDemo = useCallback(() => {
    if (isDemoRunning) {
      clearDemoTimers();
      setIsDemoRunning(false);
      setIsTyping(false);
      setAiStatus({ status: "idle" });
      setDemoProgress(-1);
      return;
    }

    setIsDemoRunning(true);
    setDemoProgress(0);
    setActiveConvId("conv-demo");
    setActiveChannel("sms");
    setConversations((prev) =>
      prev.map((c) => (c.id === "conv-demo" ? { ...c, messages: [], unreadCount: 0 } : c))
    );

    let demoRag: RagContext | null = null;

    DEMO_SCRIPT.forEach((step, idx) => {
      const t = setTimeout(() => {
        setDemoProgress(idx);
        switch (step.type) {
          case "user_message":
            addMessage("conv-demo", {
              id: `d-u-${idx}`,
              role: "user",
              content: step.content,
              channel: step.channel,
              timestamp: new Date(),
            });
            break;
          case "ai_thinking":
            setIsTyping(true);
            setAiStatus({ status: "thinking", stage: "Analysing intent…", progress: 20 });
            break;
          case "rag_retrieval":
            demoRag = {
              id: `d-rag-${idx}`,
              content:
                "Duplicate charge resolution: verify both transaction dates, issue immediate refund for the erroneous charge, apply loyalty credit per retention policy §4.2.",
              similarity: 0.97,
              source: "customer_support_conversations/dataset.csv",
              channel: step.channel,
              dataset: "Kaggle: Customer Support",
            };
            setAiStatus({ status: "thinking", stage: "RAG retrieval…", progress: 55 });
            setActiveRagContexts([demoRag]);
            break;
          case "ai_response":
            setIsTyping(false);
            setAiStatus({ status: "streaming", stage: "Streaming response…", progress: 82 });
            addMessage("conv-demo", {
              id: `d-ai-${idx}`,
              role: "assistant",
              content: step.content,
              channel: step.channel,
              timestamp: new Date(),
              ragContexts: demoRag ? [demoRag] : [],
              metadata: { model: "featherless/deepseek-r1", latency: 1247, tokens: 94, ragHits: 4 },
            });
            setTimeout(() => setAiStatus({ status: "idle" }), 500);
            break;
          case "channel_switch":
            setActiveChannel(step.channel);
            break;
          case "voice_generating":
            setAiStatus({ status: "voice_generating", stage: "ElevenLabs TTS…", progress: 96 });
            break;
          case "voice_ready":
            addMessage("conv-demo", {
              id: `d-v-${idx}`,
              role: "assistant",
              content: step.content,
              channel: step.channel,
              timestamp: new Date(),
              isVoiceReady: true,
              audioUrl: "/demo/voice-summary.mp3",
              metadata: { model: "elevenlabs/v3-turbo", latency: 1580 },
            });
            setAiStatus({ status: "idle" });
            setIsDemoRunning(false);
            setDemoProgress(-1);
            break;
        }
      }, step.delay);
      demoTimersRef.current.push(t);
    });
  }, [isDemoRunning, clearDemoTimers, addMessage]);

  // ── Channel Switch ────────────────────────────────────────────────────────
  const handleChannelSwitch = useCallback(
    (ch: Channel) => {
      setActiveChannel(ch);
      send({ event: "channel_switch", data: { channel: ch }, conversationId: activeConvId });
    },
    [send, activeConvId]
  );

  // ── Key Handler ───────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(inputValue); }
    },
    [handleSend, inputValue]
  );

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => clearDemoTimers(), [clearDemoTimers]);

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  const cfg = CHANNEL_CONFIG[activeChannel];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-full bg-[#09090B] text-white overflow-hidden select-none">

        {/* ══════════════════════════════════════════════
            LEFT SIDEBAR
        ══════════════════════════════════════════════ */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-72 min-w-[260px] flex flex-col border-r border-white/[0.06] bg-[#101012] shrink-0 z-20"
            >
              {/* Brand Header */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight text-white">Conexiaa</p>
                      <p className="text-[10px] text-white/35 leading-none">AI Communication Bridge</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/5 rounded-lg">
                          <Bell className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Notifications</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/5 rounded-lg" onClick={() => setShowSettings(true)}>
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Settings</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/5 rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">New Conversation</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations…"
                    className="pl-9 h-9 bg-white/[0.04] border-white/[0.08] text-sm text-white placeholder:text-white/25 focus-visible:border-orange-500/40 focus-visible:ring-0 rounded-xl"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Channel Filter Pills */}
              <div className="px-3 py-2 flex gap-1.5 border-b border-white/[0.06] overflow-x-auto scrollbar-none">
                {(["all", "sms", "social", "voice"] as const).map((f) => {
                  const isActive = channelFilter === f;
                  const fCfg = f !== "all" ? CHANNEL_CONFIG[f] : null;
                  return (
                    <button
                      key={f}
                      onClick={() => setChannelFilter(f)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? f === "all"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : `${fCfg!.bgClass} bg-opacity-20 ${fCfg!.textClass} border border-current border-opacity-30`
                          : "text-white/35 hover:text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {f === "all" ? "All" : CHANNEL_CONFIG[f].label}
                    </button>
                  );
                })}
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
                <AnimatePresence initial={false}>
                  {filteredConvs.map((conv) => {
                    const cCfg = CHANNEL_CONFIG[conv.channel];
                    const CIcon = cCfg.icon;
                    const isActive = conv.id === activeConvId;
                    return (
                      <motion.button
                        key={conv.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setActiveChannel(conv.channel);
                          setConversations((prev) =>
                            prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                          );
                        }}
                        className={`w-full text-left px-3 py-3.5 border-b border-white/[0.04] transition-colors relative group ${
                          isActive
                            ? "bg-white/[0.05]"
                            : "hover:bg-white/[0.025]"
                        }`}
                        whileHover={{ x: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      >
                        {/* Active indicator bar */}
                        <motion.div
                          animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0 }}
                          className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${cCfg.bgClass}`}
                        />

                        <div className="flex items-start gap-3 pl-1">
                          <div className="relative shrink-0">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className={`text-[11px] font-bold ${cCfg.bgClass} bg-opacity-25 ${cCfg.textClass}`}>
                                {conv.contact.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full ${cCfg.bgClass} flex items-center justify-center border-2 border-[#101012]`}>
                              <CIcon className="w-2 h-2 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-[13px] font-semibold truncate ${isActive ? cCfg.textClass : "text-white/80"}`}>
                                {conv.contact.name}
                              </span>
                              <span className="text-[10px] text-white/25 shrink-0 ml-1.5">{formatTime(conv.updatedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[11px] text-white/35 truncate">{conv.lastMessage}</p>
                              {conv.unreadCount > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center"
                                >
                                  {conv.unreadCount}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {filteredConvs.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center px-4">
                    <Search className="w-8 h-8 text-white/10 mb-2" />
                    <p className="text-xs text-white/30">No conversations match &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-3 border-t border-white/[0.06] bg-[#0C0C0E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={isConnected ? { scale: [1, 1.4, 1] } : { opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: isConnected ? 2.5 : 1.5 }}
                      className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-orange-500"}`}
                    />
                    <span className="text-[11px] text-white/35">{isConnected ? "Live — FastAPI WS" : "Demo Mode"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/25">
                    <Bot className="w-3 h-3" />
                    <span className="text-[10px]">Featherless AI</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════
            MAIN CHAT COLUMN
        ══════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ─── Top Header ─────────────────────────── */}
          <header className="h-14 px-4 shrink-0 flex items-center justify-between border-b border-white/[0.06] bg-[#101012]/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}</TooltipContent>
              </Tooltip>

              {activeConv && (
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-orange-500/20 text-orange-400 text-[11px] font-bold">
                        {activeConv.contact.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-green-400 border-[1.5px] border-[#101012]"
                    />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-semibold text-white leading-tight">{activeConv.contact.name}</h2>
                    <p className="text-[10px] text-white/35 leading-tight">
                      {activeConv.contact.phone ?? activeConv.contact.socialHandle ?? "Unknown contact"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Multi-channel Indicator */}
              <MultiChannelIndicator
                channels={["sms", "social", "voice"]}
                activeChannel={activeChannel}
                onChannelClick={handleChannelSwitch}
              />

              {/* AI Status Pill */}
              <AnimatePresence mode="wait">
                {aiStatus.status !== "idle" && (
                  <motion.div
                    key="ai-pill"
                    initial={{ opacity: 0, scale: 0.85, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -4 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Activity className="w-3 h-3 text-orange-400" />
                    </motion.div>
                    <span className="text-[11px] text-orange-300 font-medium whitespace-nowrap">{aiStatus.stage ?? aiStatus.status}</span>
                    {aiStatus.progress !== undefined && (
                      <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${aiStatus.progress}%` }} className="h-full bg-orange-500 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connection Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-default ${isConnected ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                    {isConnected ? "Live" : "Demo"}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isConnected ? "Connected — FastAPI WebSocket active" : "Demo mode — AI responses simulated"}
                </TooltipContent>
              </Tooltip>

              {/* RAG Panel Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`w-8 h-8 rounded-lg transition-colors ${ragPanelOpen ? "text-orange-400 bg-orange-500/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                    onClick={() => setRagPanelOpen(!ragPanelOpen)}
                  >
                    <Database className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Toggle RAG panel</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* ─── Channel Switcher ────────────────────── */}
          <div className="px-4 py-2 shrink-0 border-b border-white/[0.06] bg-[#0C0C0E]">
            <ChannelSwitcher
              activeChannel={activeChannel}
              onChannelSwitch={handleChannelSwitch}
              channelConfig={CHANNEL_CONFIG}
            />
          </div>

          {/* ─── Demo Banner ─────────────────────────── */}
          <AnimatePresence>
            {isDemoRunning && (
              <motion.div
                key="demo-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="shrink-0 overflow-hidden px-4 pt-2"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/8 border border-orange-500/20">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                    className="w-2 h-2 rounded-full bg-orange-500 shrink-0"
                  />
                  <span className="text-[11px] text-orange-300 font-medium truncate">
                    🎯 Demo: SMS Billing Issue → Featherless AI + RAG → Social → ElevenLabs Voice
                  </span>
                  <div className="ml-auto flex gap-1 shrink-0">
                    {DEMO_SCRIPT.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ backgroundColor: i <= demoProgress ? "#FF6B00" : "rgba(255,255,255,0.12)" }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Messages ────────────────────────────── */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ChatThread
              messages={activeConv?.messages ?? []}
              channelConfig={CHANNEL_CONFIG}
              activeChannel={activeChannel}
              renderMessage={(msg: Message) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  channelConfig={CHANNEL_CONFIG}
                  ragHighlight={
                    msg.ragContexts && msg.ragContexts.length > 0 ? (
                      <RagContextHighlight contexts={msg.ragContexts} />
                    ) : undefined
                  }
                  voiceButton={
                    msg.isVoiceReady ? (
                      <VoiceReplyButton
                        messageId={msg.id}
                        audioUrl={msg.audioUrl}
                        content={msg.content}
                      />
                    ) : undefined
                  }
                />
              )}
            />

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="px-4 pb-2 shrink-0"
                >
                  <TypingIndicator
                    channel={activeChannel}
                    channelConfig={CHANNEL_CONFIG}
                    aiModel={aiStatus.model ?? "featherless/deepseek-r1"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Input Area ──────────────────────────── */}
          <div className="shrink-0 p-4 border-t border-white/[0.06] bg-[#101012]">

            {/* Demo + Stats Row */}
            <div className="flex items-center gap-2 mb-3">
              <motion.button
                onClick={runDemo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-semibold shadow transition-all ${
                  isDemoRunning
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-orange-500/30 shadow-lg"
                }`}
              >
                {isDemoRunning ? (
                  <><X className="w-3 h-3" /> Stop Demo</>
                ) : (
                  <><Play className="w-3 h-3" /> Simulate SMS → AI → Voice</>
                )}
              </motion.button>

              <div className="flex items-center gap-1 text-[10px] text-white/25">
                <Sparkles className="w-3 h-3 text-orange-500/40" />
                Featherless + ElevenLabs + PGVector RAG
              </div>

              <button
                onClick={() => setStatsOpen((p) => !p)}
                className="ml-auto flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                <TrendingUp className="w-3 h-3" />
                <span>Stats</span>
                <motion.div animate={{ rotate: statsOpen ? 180 : 0 }}>
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
              </button>
            </div>

            {/* Stats Drawer */}
            <AnimatePresence>
              {statsOpen && (
                <motion.div
                  key="stats"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    {[
                      { label: "Avg Latency", value: "967ms", Icon: Clock, color: "text-orange-400" },
                      { label: "RAG Hits", value: "4.2 avg", Icon: Database, color: "text-purple-400" },
                      { label: "Channels", value: "3 Live", Icon: Layers, color: "text-sky-400" },
                      { label: "AI Model", value: "deepseek-r1", Icon: Bot, color: "text-green-400" },
                    ].map(({ label, value, Icon, color }) => (
                      <div key={label} className="text-center">
                        <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                        <p className={`text-[12px] font-bold ${color}`}>{value}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative group">
                {/* Channel colour left-border */}
                <motion.div
                  animate={{ backgroundColor: cfg.color }}
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-70 transition-colors"
                />
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message via ${cfg.label}…`}
                  disabled={isDemoRunning}
                  className="pl-4 pr-4 h-12 bg-white/[0.04] border-white/[0.08] text-[13px] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:border-orange-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || isDemoRunning}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/25 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top">Send (Enter)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT PANEL — RAG + AI STATUS
        ══════════════════════════════════════════════ */}
        <AnimatePresence initial={false}>
          {ragPanelOpen && (
            <motion.aside
              key="rag-panel"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-68 min-w-[250px] flex flex-col border-l border-white/[0.06] bg-[#101012] overflow-y-auto shrink-0"
            >
              {/* Panel Header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-orange-400" />
                  <h3 className="text-[12px] font-semibold text-white">AI Context</h3>
                </div>
                <button onClick={() => setRagPanelOpen(false)} className="text-white/25 hover:text-white/70 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AI Pipeline Status */}
              <div className="p-4 border-b border-white/[0.06]">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2.5">AI Pipeline</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Featherless AI", sub: "deepseek-r1", active: aiStatus.status !== "idle", color: "text-orange-400", dot: "bg-orange-400" },
                    { name: "ElevenLabs TTS", sub: "v3-turbo", active: aiStatus.status === "voice_generating", color: "text-sky-400", dot: "bg-sky-400" },
                    { name: "PGVector RAG", sub: "faiss_index.bin", active: activeRagContexts.length > 0, color: "text-purple-400", dot: "bg-purple-400" },
                    { name: "Zernio Social", sub: "v2 API", active: activeChannel === "social", color: "text-green-400", dot: "bg-green-400" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/[0.025] hover:bg-white/[0.04] transition-colors">
                      <div>
                        <p className="text-[11px] font-medium text-white/75">{item.name}</p>
                        <p className="text-[9px] text-white/25">{item.sub}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${item.active ? `${item.color} bg-current bg-opacity-10` : "text-white/25 bg-white/5"}`}>
                        {item.active && (
                          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.1 }} className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                        )}
                        {item.active ? "Active" : "Standby"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAG Contexts */}
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">
                    Retrieved Contexts
                  </p>
                  <Badge variant="outline" className="text-[9px] border-white/10 text-white/30 py-0 px-1.5">
                    {activeRagContexts.length}
                  </Badge>
                </div>

                <AnimatePresence mode="popLayout">
                  {activeRagContexts.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center py-8 text-center"
                    >
                      <Database className="w-7 h-7 text-white/8 mb-2" />
                      <p className="text-[11px] text-white/20 leading-relaxed">
                        RAG contexts appear here when the AI retrieves relevant knowledge base entries.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      {activeRagContexts.map((ctx) => (
                        <motion.div
                          key={ctx.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          layout
                        >
                          <RagContextHighlight contexts={[ctx]} compact />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dataset Summary */}
              <div className="p-4 border-t border-white/[0.06] shrink-0">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2.5">Kaggle Datasets</p>
                <div className="space-y-2">
                  {[
                    { name: "Twitter Customer Support", docs: "2.8M", color: "bg-purple-500" },
                    { name: "Multi-Channel Dialogues", docs: "450K", color: "bg-sky-500" },
                    { name: "Tech Conversations", docs: "180K", color: "bg-orange-500" },
                    { name: "Direct Messaging (SMS)", docs: "95K", color: "bg-green-500" },
                  ].map((ds) => (
                    <div key={ds.name} className="flex items-center gap-2 group">
                      <div className={`w-1.5 h-1.5 rounded-full ${ds.color} shrink-0`} />
                      <span className="text-[10px] text-white/45 flex-1 truncate group-hover:text-white/65 transition-colors">{ds.name}</span>
                      <span className="text-[9px] text-white/20 shrink-0">{ds.docs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════
            SETTINGS DIALOG
        ══════════════════════════════════════════════ */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-[#111113] border-white/[0.08] text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[14px]">
                <Settings className="w-4 h-4 text-orange-400" />
                Conexiaa Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              {[
                { label: "WebSocket URL", value: WS_URL },
                { label: "AI Model", value: "featherless/deepseek-r1" },
                { label: "ElevenLabs Voice", value: "Rachel (en-US, v3-turbo)" },
                { label: "RAG Index", value: "data/embeddings/faiss_index.bin" },
                { label: "Embedding Model", value: "text-embedding-3-small (OpenAI)" },
                { label: "Vector DB", value: "PGVector + FAISS fallback" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] text-white/35 mb-1">{s.label}</p>
                  <p className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] text-white/60 font-mono">{s.value}</p>
                </div>
              ))}

              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="text-[12px] font-medium text-white/80">Demo Mode</p>
                  <p className="text-[10px] text-white/35">Simulate AI responses without backend</p>
                </div>
                <button
                  onClick={() => setDemoMode((p) => !p)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${demoMode ? "bg-orange-500" : "bg-white/15"}`}
                >
                  <motion.div
                    animate={{ x: demoMode ? 21 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                  />
                </button>
              </div>

              {!isConnected && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/8 border border-orange-500/15">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-orange-300/80">
                    Backend not reachable. Start FastAPI with <code className="font-mono">uvicorn backend.main:app --reload</code>, then refresh.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}