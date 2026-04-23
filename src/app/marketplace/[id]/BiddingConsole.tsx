"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Gavel, Loader2, ShieldCheck, Clock, ArrowRight } from "lucide-react"
import { placeBid } from "../actions"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

export default function BiddingConsole({ 
  property, 
  highestBid, 
  hasPaidEmd,
  isLoggedIn: _isLoggedIn,
  userId
}: { 
  property: Record<string, unknown>,
  highestBid: number | null,
  hasPaidEmd: boolean,
  isLoggedIn: boolean,
  userId?: string
}) {
  const [loading, setLoading] = useState<'emd' | 'bid' | null>(null)
  const [bidAmount, setBidAmount] = useState<string>("")
  const [currentHighestBid, setCurrentHighestBid] = useState<number | null>(highestBid)
  const [timeLeft, setTimeLeft] = useState<string>("Loading...")
  const [auctionState, setAuctionState] = useState<'upcoming' | 'live' | 'ended'>(
    property.status === 'sold' ? 'ended' : 'upcoming'
  )
  // Stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!property.auction_start_time || !property.auction_end_time) {
      setTimeLeft("Not Scheduled")
      return
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const start = new Date(property.auction_start_time).getTime()
      const end = new Date(property.auction_end_time).getTime()

      if (now < start) {
        setAuctionState('upcoming')
        setTimeLeft(formatTime(start - now))
      } else if (now >= start && now <= end && property.status !== 'sold') {
        setAuctionState('live')
        setTimeLeft(formatTime(end - now))
      } else {
        setAuctionState('ended')
        setTimeLeft("Ended")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [property])

  const formatTime = (distance: number) => {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  useEffect(() => {
    const channel = supabase.channel(`public:bids:property_id=eq.${property.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `property_id=eq.${property.id}`
      }, (payload) => {
        const newBidAmount = Number(payload.new.amount)
        setCurrentHighestBid((prev) => {
          if (!prev || newBidAmount > prev) return newBidAmount
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [property.id, supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const formatUnit = (unit: string) => {
    if (!unit) return ''
    return unit.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const perUnitPrice = property.reserve_price && property.area_sqft 
    ? property.reserve_price / property.area_sqft 
    : null;

  const actualHighest = currentHighestBid || property.reserve_price || 0
  const minNextBid = actualHighest + (actualHighest * 0.01) // 1% increment rule placeholder

  const handlePlaceBid = async () => {
    if (!bidAmount) return
    const amount = Number(bidAmount)
    
    if (amount <= actualHighest) {
      alert(`Bid must be higher than ${formatCurrency(actualHighest)}`)
      return
    }

    setLoading('bid')
    const res = await placeBid(property.id, amount)
    if (res?.error) alert(res.error)
    else setBidAmount("") // clear input on success
    setLoading(null)
  }

  return (
    <div className="sticky top-40 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex justify-between items-start pb-6 border-b border-zinc-800">
        <div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Current Highest Bid</p>
          <p className="text-3xl font-bold text-white">
            {currentHighestBid ? formatCurrency(currentHighestBid) : 'No Bids'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 text-sm font-medium mb-1">
            {auctionState === 'upcoming' ? 'Starts in' : auctionState === 'live' ? 'Time Left' : 'Status'}
          </p>
          <p className={`text-xl font-bold flex items-center justify-end ${auctionState === 'live' ? 'text-emerald-400' : auctionState === 'upcoming' ? 'text-amber-400' : 'text-zinc-500'}`}>
            <Clock className="w-5 h-5 mr-1.5" />
            {timeLeft}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Reserve Price</span>
            <span className="text-white font-medium">{property.reserve_price ? formatCurrency(property.reserve_price) : 'Not Disclosed'}</span>
          </div>
          {perUnitPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Price per {formatUnit(property.area_unit)}</span>
              <span className="text-white font-medium">{formatCurrency(perUnitPrice)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Earnest Money Deposit</span>
            <span className="text-white font-medium">{property.emd_amount ? formatCurrency(property.emd_amount) : 'To Be Determined'}</span>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          {auctionState === 'ended' || property.status === 'sold' ? (
            <div className={`py-6 text-center rounded-xl border ${property.winner_id === userId && userId ? 'bg-emerald-950/50 border-emerald-800' : 'bg-zinc-950 border-zinc-800'}`}>
              <p className="text-xl font-bold text-white mb-2">Auction Closed</p>
              {property.winner_id === userId && userId ? (
                <div>
                  <p className="text-sm font-medium text-emerald-400">🎉 Congratulations!</p>
                  <p className="text-xs text-zinc-400 mt-1">You won this auction with the highest bid.</p>
                </div>
              ) : property.winner_id ? (
                <p className="text-sm text-zinc-400">This property has been officially sold.</p>
              ) : (
                <p className="text-sm text-zinc-400">This auction ended with no bids.</p>
              )}
            </div>
          ) : !hasPaidEmd ? (
            <div className="space-y-3">
              <Link href={`/auctions/${property.id}/register`} className="block">
                <Button className="w-full h-12 text-base font-semibold bg-amber-600 hover:bg-amber-500 text-white gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Register via Bank Transfer
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <p className="text-center text-xs text-zinc-500">
                Pay EMD of {property.emd_amount ? formatCurrency(property.emd_amount) : '—'} via NEFT/RTGS to unlock bidding.
              </p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Bid Amount</label>
                <CurrencyInput 
                  value={bidAmount} 
                  onValueChange={(val) => setBidAmount(val)} 
                  placeholder={`Min: ${formatCurrency(minNextBid)}`} 
                  className="bg-zinc-950 border-emerald-900/50 focus-visible:ring-emerald-500 text-white h-12 text-lg"
                />
              </div>
              <Button 
                onClick={handlePlaceBid}
                disabled={loading === 'bid' || !bidAmount || auctionState !== 'live'}
                className={`w-full h-12 text-lg font-medium text-white ${auctionState === 'live' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-700 cursor-not-allowed opacity-50'}`}
              >
                {loading === 'bid' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Gavel className="w-5 h-5 mr-2" />}
                {auctionState === 'live' ? 'Place Bid' : 'Auction Not Started'}
              </Button>
              <p className="text-center text-xs text-emerald-500/80 font-medium">
                EMD Paid. You are verified to bid.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
