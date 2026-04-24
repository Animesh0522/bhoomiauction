"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"

type Step = "EMAIL" | "OTP"
type Mode = "signin" | "signup"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<Step>("EMAIL")
  const [mode, setMode] = useState<Mode>("signin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.")
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: mode === "signup" ? { full_name: fullName } : undefined,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMessage(`A 6-digit OTP has been sent to ${email}. Check your inbox.`)
      setStep("OTP")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    // Check if this is a new user (signup) — redirect to onboarding
    const isNewUser = mode === "signup" || !data.user?.user_metadata?.role
    if (isNewUser && mode === "signup") {
      router.push("/onboarding")
    } else {
      router.push("/dashboard")
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-base">B</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Bhoomi<span className="text-emerald-400">Auction</span>
          </span>
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => { setMode("signin"); setError(null); setStep("EMAIL") }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === "signin" ? "text-white border-b-2 border-emerald-400 bg-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); setStep("EMAIL") }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === "signup" ? "text-white border-b-2 border-emerald-400 bg-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-7 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-xl font-bold text-white">
                {mode === "signup" ? "Join BhoomiAuction" : "Welcome back"}
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                {step === "EMAIL"
                  ? mode === "signup"
                    ? "Create your free account to start bidding or listing properties."
                    : "Enter your email to receive a secure login code."
                  : `Enter the 6-digit code sent to ${email}`}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/40 border border-red-900/50 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Success message */}
            {message && step === "OTP" && (
              <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-sm rounded-xl px-4 py-3">
                {message}
              </div>
            )}

            {step === "EMAIL" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Animesh Sharma"
                      required={mode === "signup"}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending Code...</>
                  ) : (
                    <>{mode === "signup" ? "Create Account" : "Send Login Code"} <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.5em] text-center outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-700"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Verify & Continue</>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep("EMAIL"); setOtp(""); setMessage(null) }}
                  className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← Use a different email
                </button>
              </form>
            )}

            <p className="text-xs text-zinc-600 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
