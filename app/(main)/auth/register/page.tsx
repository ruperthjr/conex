"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── UI Primitives (Shadcn/UI) ──────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Configuration (env‑based) ──────────────────────────────────────────
const AUTH_REGISTER_URL =
  process.env.NEXT_PUBLIC_AUTH_REGISTER_URL ||
  "http://localhost:8000/api/v1/auth/register";

// ─── Simple email regex ─────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Component ──────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Validation ───────────────────────────────────────────────────────
  const nameError =
    name.length > 0 && name.trim().length < 2
      ? "Name must be at least 2 characters."
      : null;

  const emailError =
    email.length > 0 && !EMAIL_REGEX.test(email)
      ? "Please enter a valid email address."
      : null;

  const passwordError =
    password.length > 0 && password.length < 6
      ? "Password must be at least 6 characters."
      : null;

  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? "Passwords do not match."
      : null;

  const isFormValid =
    name.trim().length >= 2 &&
    email.length > 0 &&
    EMAIL_REGEX.test(email) &&
    password.length >= 6 &&
    confirmPassword === password &&
    !isLoading;

  // ── Submit handler ────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!isFormValid || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(AUTH_REGISTER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Registration failed (${res.status})`);
        }

        const data = await res.json();
        // Optionally store token (if backend auto‑logs in)
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      } catch (err: any) {
        setError(err.message || "Unable to connect. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, password, confirmPassword, isFormValid, isLoading, router]
  );

  // ── Demo quick register (for hackathon judges) ────────────────────────
  const handleDemoRegister = useCallback(() => {
    setName("Demo User");
    setEmail("demo@conexiaa.ai");
    setPassword("demo123456");
    setConfirmPassword("demo123456");
    setTimeout(() => handleSubmit(), 50);
  }, [handleSubmit]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] px-4">
        {/* Animated background dots */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,107,0,0.15) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md z-10"
        >
          <Card className="border-white/[0.08] bg-[#0C0C0E]/80 backdrop-blur-xl shadow-2xl shadow-orange-500/5">
            <CardHeader className="pb-2">
              {/* Logo / Brand */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Conexiaa
                </h1>
              </div>
              <p className="text-sm text-white/40">
                Create your AI Communication Bridge account
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              {/* Success state */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Account created! Redirecting to dashboard...
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-sm text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:border-orange-500/50 transition-colors",
                        nameError && "border-red-500/50"
                      )}
                      disabled={isLoading || success}
                      autoComplete="name"
                      aria-invalid={!!nameError}
                    />
                  </div>
                  <AnimatePresence>
                    {nameError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-red-400 mt-1 pl-2"
                      >
                        {nameError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-sm text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:border-orange-500/50 transition-colors",
                        emailError && "border-red-500/50"
                      )}
                      disabled={isLoading || success}
                      autoComplete="email"
                      aria-invalid={!!emailError}
                    />
                  </div>
                  <AnimatePresence>
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-red-400 mt-1 pl-2"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "pl-9 pr-10 h-10 bg-white/[0.04] border-white/[0.08] text-sm text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:border-orange-500/50 transition-colors",
                        passwordError && "border-red-500/50"
                      )}
                      disabled={isLoading || success}
                      autoComplete="new-password"
                      aria-invalid={!!passwordError}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {passwordError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-red-400 mt-1 pl-2"
                      >
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        "pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-sm text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:border-orange-500/50 transition-colors",
                        confirmError && "border-red-500/50"
                      )}
                      disabled={isLoading || success}
                      autoComplete="new-password"
                      aria-invalid={!!confirmError}
                    />
                  </div>
                  <AnimatePresence>
                    {confirmError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-red-400 mt-1 pl-2"
                      >
                        {confirmError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className={cn(
                    "w-full h-10 text-sm font-semibold rounded-xl transition-all shadow-lg",
                    "bg-gradient-to-r from-orange-600 to-orange-500 text-white",
                    "hover:from-orange-500 hover:to-orange-400",
                    "shadow-orange-500/20 hover:shadow-orange-500/30",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1.5" />
                  )}
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0C0C0E] text-white/25">
                    or
                  </span>
                </div>
              </div>

              {/* Demo quick register */}
              <Button
                variant="outline"
                onClick={handleDemoRegister}
                disabled={isLoading || success}
                className="w-full h-10 text-sm font-medium border-white/10 text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <Zap className="w-4 h-4 mr-1.5 text-orange-400" />
                Demo Account (instant register)
              </Button>
            </CardContent>

            <CardFooter className="justify-center pt-2 pb-4">
              <p className="text-xs text-white/30">
                Already have an account?{" "}
                <button
                  onClick={() => router.push("/auth/login")}
                  className="text-orange-400 hover:text-orange-300 font-medium transition-colors underline underline-offset-2"
                >
                  Sign in
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}