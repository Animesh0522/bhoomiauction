"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"
import { approveProperty, rejectProperty } from "../actions"

export function PropertyActions({ propertyId, reservePrice }: { propertyId: string, reservePrice?: number | null }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  
  // Auto-calculate 10% of reserve price for EMD default (raw numeric string)
  const defaultEmd = reservePrice ? Math.floor(reservePrice * 0.1).toString() : ""
  const [emdAmount, setEmdAmount] = useState<string>(defaultEmd)
  
  const [startDate, setStartDate] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'approve') {
      const errors: string[] = []
      if (!emdAmount || emdAmount === "0") errors.push("EMD Amount")
      if (!startDate) errors.push("Start Date")
      if (!startTime) errors.push("Start Time")
      if (!endDate) errors.push("End Date")
      if (!endTime) errors.push("End Time")
      
      if (errors.length > 0) {
        setValidationErrors(errors)
        return
      }
      setValidationErrors([])
    }

    setLoading(action)
    try {
      if (action === 'approve') {
        const startIso = new Date(`${startDate}T${startTime}:00`).toISOString()
        const endIso = new Date(`${endDate}T${endTime}:00`).toISOString()
        const numericEmd = Number(emdAmount.replace(/[^0-9]/g, ""))
        const res = await approveProperty(propertyId, numericEmd, startIso, endIso)
        if (res?.error) throw new Error(res.error)
      }
      if (action === 'reject') {
        const res = await rejectProperty(propertyId)
        if (res?.error) throw new Error(res.error)
      }
    } catch (e: unknown) {
      console.error("Action error:", e)
      alert("Error: " + (e instanceof Error ? e.message : JSON.stringify(e)))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-5 pt-0 mt-auto space-y-4">
      <div className="space-y-4 pt-4 border-t border-zinc-800">

        {/* EMD Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            EMD Amount (₹)
            <span className="text-zinc-600 normal-case font-normal tracking-normal">(auto: 10% of reserve)</span>
          </label>
          <CurrencyInput 
            value={emdAmount} 
            onValueChange={(val) => { setEmdAmount(val); setValidationErrors([]) }} 
            placeholder="E.g. 50,000" 
            className="bg-zinc-950 border-zinc-800 text-white h-9"
          />
        </div>

        {/* Auction Start */}
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div className="bg-emerald-950/20 border-b border-zinc-800 px-3 py-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Auction Start</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <div className="p-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Date</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setValidationErrors([]) }}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-transparent text-white text-xs outline-none border-0 cursor-pointer h-7"
              />
            </div>
            <div className="p-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Time</label>
              <input 
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setValidationErrors([]) }}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-transparent text-white text-xs outline-none border-0 cursor-pointer h-7"
              />
            </div>
          </div>
        </div>

        {/* Auction End */}
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div className="bg-red-950/20 border-b border-zinc-800 px-3 py-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Auction End</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <div className="p-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Date</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setValidationErrors([]) }}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-transparent text-white text-xs outline-none border-0 cursor-pointer h-7"
              />
            </div>
            <div className="p-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Time</label>
              <input 
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setValidationErrors([]) }}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-transparent text-white text-xs outline-none border-0 cursor-pointer h-7"
              />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="flex items-start gap-2 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1">Please fill in:</p>
              <ul className="text-xs text-red-300/80 space-y-0.5">
                {validationErrors.map(err => <li key={err}>• {err}</li>)}
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={() => handleAction('reject')}
          disabled={!!loading}
          className="w-full border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300"
        >
          {loading === 'reject' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
          Reject
        </Button>
        <Button 
          onClick={() => handleAction('approve')}
          disabled={!!loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {loading === 'approve' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Approve
        </Button>
      </div>
    </div>
  )
}
