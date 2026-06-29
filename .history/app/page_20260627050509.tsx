"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoMessage = {
  id: number;
  text: string;
  type: "user" | "ai";
};

export default function LandingPage() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const addMessage = (text: string, type: "user" | "ai") => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, type },
    ]);
  };

  // Simulated AI demo flow (hackathon magic)
  useEffect(() => {
    const sequence = async () => {
      try {
        // Step 1: User SMS
        await delay(800);
        addMessage("Hey, my package hasn’t arrived yet 😕", "user");

        // Step 2: AI thinking
        await delay(1200);
        setIsTyping(true);

        // Step 3: AI response with RAG
        await delay(1800);
        setIsTyping(false);
        addMessage(
          "I found your order in our system — it’s currently out for delivery and should arrive today before 6PM 📦",
          "ai"
        );

        // Step 4: Voice simulation
        await delay(1000);
        setStep(1);
      } catch (err) {
        console.error("Demo sequence failed:", err);
      }
    };

    sequence();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-120px)] text-center">
      {/* HERO */}
      <div className="max-w-4xl space-y-6 fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00] text-xs">
           Real-Time AI Communication Bridge
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
          Unify SMS, Social & Voice
          <br />
          <span className="text-[#FF6B00]">With Intelligent AI Routing</span>
        </h1>

        <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
          Conexiaa transforms fragmented conversations into one intelligent,
          real-time system powered by Featherless AI, RAG, and voice synthesis.
        </p>

        {/* CTA */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          <Link href="/chat">
            <Button className="btn-orange glow-orange text-sm md:text-base px-6 py-3">
              🚀 Launch Live Chat Demo
            </Button>
          </Link>

          <Link href="/ai-bridge">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 text-sm md:text-base px-6 py-3"
            >
              🎙️ Explore AI Bridge
            </Button>
          </Link>
        </div>
      </div>

      {/* DEMO CHAT WINDOW */}
      <div className="mt-12 w-full max-w-2xl glass rounded-xl p-4 border-glow">
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <span>Live Multi-Channel Simulation</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Active
          </span>
        </div>

        <div className="space-y-3 text-left min-h-[160px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "message-bubble",
                msg.type === "user"
                  ? "message-outgoing ml-auto"
                  : "message-incoming"
              )}
            >
              {msg.type === "ai" ? (
                <span>
                  {/* RAG Highlight effect */}
                  <span className="rag-highlight">AI:</span> {msg.text}
                </span>
              ) : (
                msg.text
              )}
            </div>
          ))}

          {isTyping && (
            <div className="message-bubble message-incoming">
              <div className="flex gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* VOICE SIMULATION */}
        {step === 1 && (
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20">
            <span className="text-xs text-[#FF6B00]">
              🔊 AI Voice Reply (ElevenLabs)
            </span>

            <div className="voice-wave">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* FEATURES */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {features.map((feature, i) => (
          <div
            key={i}
            className="glass rounded-xl p-5 text-left border-glow hover:scale-[1.02] transition"
          >
            <div className="text-[#FF6B00] text-lg mb-2">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* FOOTER CTA */}
      <div className="mt-16 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Built for speed. Designed for impact. Ready for judges.
        </p>

        <Link href="/chat">
          <Button className="btn-orange glow-orange px-8 py-3 text-base">
            Enter the Experience →
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* =========================
   FEATURE DATA
========================= */
const features = [
  {
    icon: "💬",
    title: "Unified Messaging",
    description:
      "Seamlessly switch between SMS, social, and voice in a single intelligent thread.",
  },
  {
    icon: "🧠",
    title: "AI Routing + RAG",
    description:
      "Featherless AI understands context and retrieves knowledge instantly.",
  },
  {
    icon: "🎙️",
    title: "Voice Synthesis",
    description:
      "Generate natural AI voice replies powered by ElevenLabs in real-time.",
  },
];