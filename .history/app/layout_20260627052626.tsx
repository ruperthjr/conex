import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import { ReactNode, Suspense } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Conexiaa",
  description:
    "Unify SMS, Social (Zernio), and Voice (ElevenLabs) with AI-powered routing, RAG intelligence, and real-time conversations.",
  keywords: [
    "AI",
    "Communication",
    "SMS",
    "Voice",
    "Zernio",
    "ElevenLabs",
    "Featherless AI",
    "RAG",
    "Hackathon",
  ],
  authors: [{ name: "Conexiaa Team" }],
  openGraph: {
    title: "Conexiaa",
    description:
      "Magical unified messaging with AI routing, voice playback, and multi-channel intelligence.",
    url: "https://conexiaa.app",
    siteName: "Conexiaa",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630,
        alt: "Conexiaa AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
};

function RootBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-black" />

      {/* Orange Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6B00]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6B00]/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#FF6B00 1px, transparent 1px), linear-gradient(90deg, #FF6B00 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated Glow Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent animate-pulse" />
    </div>
  );
}

function GlobalLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Connecting AI channels...
        </p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          playfair.variable, inter.variable,
          "min-h-screen bg-black text-white antialiased selection:bg-[#FF6B00] selection:text-white"
        )}
      >
        <RootBackground />

        {/* Global Providers */}
        <TooltipProvider delayDuration={150}>
          <Toaster />

          {/* App Container */}
          <div className="relative flex min-h-screen flex-col">
            {/* Top Glow Navigation Bar */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-black/40">
              <div className="flex items-center justify-between px-4 py-3 md:px-6">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#FF6B00]/40">
                      <span className="font-bold text-black text-lg">
                        C
                      </span>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-[#FF6B00] blur-xl opacity-40 animate-pulse" />
                  </div>

                  {/* Title */}
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-sm tracking-wide">
                      Conexiaa
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      AI Communication Bridge
                    </span>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-muted-foreground">
                      Realtime Connected
                    </span>
                  </div>

                  <div className="px-3 py-1 rounded-full text-xs bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30">
                    Live Demo
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 px-3 py-4 md:px-6 md:py-6">
              <Suspense fallback={<GlobalLoading />}>
                {children}
              </Suspense>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
                <span>
                  © {new Date().getFullYear()} Conexiaa — AI Messaging Unified
                </span>
              </div>
            </footer>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}