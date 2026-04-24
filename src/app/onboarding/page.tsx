"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Building2, Search, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"

export default function OnboardingPage() {
  const [selected, setSelected] = useState<"buyer" | "seller" | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)

    // Save role preference to user metadata
    await supabase.auth.updateUser({
      data: { role: selected }
    })

    setLoading(false)
    if (selected === "seller") {
      router.push("/seller/listings/new")
    } else {
      router.push("/marketplace")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-base">B</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Bhoomi<span className="text-emerald-400">Auction</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Welcome! What would you like to do?</h1>
          <p className="text-zinc-400">Choose how you want to use BhoomiAuction. You can always switch later.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Buyer */}
          <button
            onClick={() => setSelected("buyer")}
            className={`relative group rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
              selected === "buyer"
                ? "border-emerald-500 bg-emerald-950/30"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
            }`}
          >
            {selected === "buyer" && (
              <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-emerald-400" />
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              selected === "buyer" ? "bg-emerald-500/20" : "bg-zinc-800"
            }`}>
              <Search className={`w-6 h-6 ${selected === "buyer" ? "text-emerald-400" : "text-zinc-400"}`} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Buy Property</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Browse verified listings, register for auctions, and bid on your dream property.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Browse auctions", "Place bids", "Track bids"].map(tag => (
                <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </button>

          {/* Seller */}
          <button
            onClick={() => setSelected("seller")}
            className={`relative group rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
              selected === "seller"
                ? "border-cyan-500 bg-cyan-950/20"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
            }`}
          >
            {selected === "seller" && (
              <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-cyan-400" />
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              selected === "seller" ? "bg-cyan-500/20" : "bg-zinc-800"
            }`}>
              <Building2 className={`w-6 h-6 ${selected === "seller" ? "text-cyan-400" : "text-zinc-400"}`} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Sell Property</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              List your property for auction. Reach thousands of verified buyers across India.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["List property", "Set reserve price", "Track bids"].map(tag => (
                <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className={`w-full h-14 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all ${
            selected
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account...</>
          ) : (
            <>Continue <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Skip for now → Go to Dashboard
        </button>
      </div>
    </div>
  )
}
