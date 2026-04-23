"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Copy, CheckCircle2, Loader2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react"

interface AccountDetails {
  virtual_account_id: string
  account_number: string
  ifsc: string
  emd_amount: number
  already_exists?: boolean
  emd_status?: string
}

export default function EmdRegistrationClient({ auctionId, propertyTitle, emdAmount }: {
  auctionId: string
  propertyTitle: string
  emdAmount: number
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null)
  const [copied, setCopied] = useState<"account" | "ifsc" | null>(null)
  const [pollingStatus, setPollingStatus] = useState<string | null>(null)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  const handleGenerateAccount = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/emd/create-virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auction_id: auctionId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.")
      } else {
        setAccountDetails(data)
        // Start polling for payment confirmation if not yet paid
        if (data.emd_status !== "emd_received") {
          startPolling(data.virtual_account_id)
        }
      }
    } catch (e: any) {
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (vaId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/emd/status?auction_id=${auctionId}`)
        const data = await res.json()
        if (data.emd_status === "emd_received" || data.emd_status === "paid") {
          setAccountDetails(prev => prev ? { ...prev, emd_status: data.emd_status } : prev)
          setPollingStatus("confirmed")
          clearInterval(interval)
        }
      } catch {}
    }, 10000) // poll every 10s
    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000)
  }

  const handleCopy = (text: string, field: "account" | "ifsc") => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const isEmdPaid = accountDetails?.emd_status === "paid" || accountDetails?.emd_status === "emd_received"

  return (
    <div className="space-y-6">
      {!accountDetails ? (
        /* Step 1: Generate Account */
        <div className="space-y-5">
          {/* Info box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">How EMD Registration Works</p>
            </div>
            <ol className="space-y-2 text-sm text-zinc-400 ml-7 list-decimal">
              <li>Click the button below to generate a dedicated Virtual Bank Account.</li>
              <li>Transfer exactly <span className="text-white font-semibold">{formatCurrency(emdAmount)}</span> to that account via NEFT or RTGS.</li>
              <li>Once your transfer is confirmed, bidding will unlock automatically within minutes.</li>
              <li>Your EMD is fully refundable if you do not win the auction.</li>
            </ol>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGenerateAccount}
            disabled={loading}
            className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-3"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Account...</>
            ) : (
              <><Building2 className="w-5 h-5" /> Generate EMD Bank Details</>
            )}
          </Button>
          <p className="text-center text-xs text-zinc-600">
            A unique Virtual Account will be created exclusively for you for this auction.
          </p>
        </div>
      ) : (
        /* Step 2: Show Account Details */
        <div className="space-y-5">
          {accountDetails.already_exists && (
            <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-900/50 rounded-lg px-4 py-3 text-sm text-blue-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You already registered. Here are your existing bank details.
            </div>
          )}

          {isEmdPaid ? (
            <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">EMD Payment Confirmed!</p>
              <p className="text-sm text-zinc-400 mt-1">Your deposit has been received. You are eligible to bid.</p>
            </div>
          ) : (
            /* Transfer instructions */
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-bold">Important Transfer Instructions</p>
              </div>
              <p className="text-sm text-amber-200/80 ml-6">
                Transfer <span className="font-bold text-white">{formatCurrency(accountDetails.emd_amount)}</span> exactly via{" "}
                <span className="font-bold">NEFT or RTGS only</span>. Any other amount or payment method will not activate your account.
              </p>
            </div>
          )}

          {/* Account Details Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Virtual Bank Account Details</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {/* Account Number */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="text-xl font-mono font-bold text-white tracking-widest">{accountDetails.account_number}</p>
                </div>
                <button
                  onClick={() => handleCopy(accountDetails.account_number, "account")}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg"
                >
                  {copied === "account" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied === "account" ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* IFSC */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">IFSC Code</p>
                  <p className="text-xl font-mono font-bold text-white tracking-widest">{accountDetails.ifsc}</p>
                </div>
                <button
                  onClick={() => handleCopy(accountDetails.ifsc, "ifsc")}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg"
                >
                  {copied === "ifsc" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied === "ifsc" ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Amount to Transfer */}
              <div className="px-5 py-4 bg-emerald-950/10">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Amount to Transfer</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(accountDetails.emd_amount)}</p>
                <p className="text-xs text-zinc-500 mt-1">via NEFT / RTGS only</p>
              </div>

              {/* Bank Name */}
              <div className="px-5 py-3 bg-zinc-950/50">
                <p className="text-xs text-zinc-500">Powered by <span className="text-zinc-400 font-medium">RBL Bank</span> via Razorpay</p>
              </div>
            </div>
          </div>

          {!isEmdPaid && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">What happens next?</p>
              <div className="space-y-2">
                {[
                  "Make the NEFT/RTGS transfer from your bank.",
                  "Razorpay will confirm the payment automatically.",
                  "Your bidding access unlocks within 1–4 banking hours.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</div>
                    <p className="text-sm text-zinc-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
