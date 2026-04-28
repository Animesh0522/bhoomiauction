"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { approveKyc, rejectKyc } from "../actions"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function KycReviewActions({ userId }: { userId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    try {
      setLoading("approve")
      await approveKyc(userId)
      router.refresh()
    } catch (e: any) {
      alert(e.message)
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.")
      return
    }
    try {
      setLoading("reject")
      await rejectKyc(userId, rejectReason)
      router.refresh()
    } catch (e: any) {
      alert(e.message)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-4">
      <div className="flex gap-3 w-full">
        <button
          onClick={() => setShowRejectForm(!showRejectForm)}
          disabled={loading !== null}
          className="flex-1 h-12 bg-zinc-900 border border-red-900/50 hover:bg-red-950/30 text-red-400 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Approve Profile
        </button>
      </div>

      {showRejectForm && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 mt-2 animate-in slide-in-from-top-2">
          <label className="text-sm font-medium text-zinc-300">Reason for Rejection</label>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g., PAN card name does not match Bank account name..."
            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-3 text-sm min-h-[100px] outline-none focus:border-red-500"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowRejectForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
            <button
              onClick={handleReject}
              disabled={loading === "reject"}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2"
            >
              {loading === "reject" && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
