"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, ArrowRight, MailCheck } from "lucide-react"
import Link from "next/link"

type Mode = "signin" | "signup"
type Step = "EMAIL" | "SENT"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get("tab") === "signup" ? "signup" : "signin") as Mode

  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [step, setStep] = useState<Step>("EMAIL")
  const [mode, setMode] = useState<Mode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync if user navigates between ?tab=signin and ?tab=signup
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "signup" || tab === "signin") setMode(tab)
  }, [searchParams])

  const supabase = createClient()

  const handleSendLink = async (e: React.FormEvent) => {
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep("SENT")
    }
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

          {step === "EMAIL" ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => { setMode("signin"); setError(null) }}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    mode === "signin" ? "text-white border-b-2 border-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(null) }}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    mode === "signup" ? "text-white border-b-2 border-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="p-7 space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {mode === "signup" ? "Join BhoomiAuction" : "Welcome back"}
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">
                    {mode === "signup"
                      ? "Create your free account to start bidding or listing properties."
                      : "Enter your email and we'll send you a secure login link."}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-950/40 border border-red-900/50 text-red-300 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendLink} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Your full name"
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
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                    ) : (
                      <>{mode === "signup" ? "Create Account" : "Send Login Link"} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-zinc-600 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </>
          ) : (
            /* SUCCESS STATE — link sent */
            <div className="p-7 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-900/50 flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Check your email</h2>
                <p className="text-sm text-zinc-400 mt-2">
                  We sent a secure login link to:
                </p>
                <p className="text-sm font-semibold text-emerald-400 mt-1">{email}</p>
                <p className="text-sm text-zinc-400 mt-3">
                  Click the link in the email to{" "}
                  {mode === "signup" ? "complete your registration" : "sign in"}
                  . It expires in 1 hour.
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl px-4 py-3 text-left space-y-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Didn&apos;t get the email?</p>
                <p className="text-xs text-zinc-500">Check your spam/junk folder, or</p>
                <button
                  onClick={() => { setStep("EMAIL"); setError(null) }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Try a different email address →
                </button>
              </div>

              <button
                onClick={() => { setStep("EMAIL"); setError(null) }}
                className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
