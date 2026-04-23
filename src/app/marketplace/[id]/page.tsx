import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { MapPin, Expand, Compass, Ruler, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import ImageGallery from "./ImageGallery"
import BiddingConsole from "./BiddingConsole"
import { closeAuction } from "../actions"

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch the specific property
  let { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!property) {
    notFound()
  }

  // Check if auction needs to be closed lazily
  if (property.status === 'approved' && property.auction_end_time) {
    const now = new Date().getTime()
    const end = new Date(property.auction_end_time).getTime()
    if (now > end) {
      await closeAuction(property.id)
      const { data: refreshedProperty } = await supabase.from('properties').select('*').eq('id', params.id).single()
      if (refreshedProperty) property = refreshedProperty
    }
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check EMD status
  let hasPaidEmd = false
  if (user) {
    const { data: participant } = await supabase
      .from('auction_participants')
      .select('*')
      .eq('property_id', params.id)
      .eq('user_id', user.id)
      .single()
    if (participant && participant.emd_paid) hasPaidEmd = true
  }

  // Fetch highest bid
  const { data: highestBidRow } = await supabase
    .from('bids')
    .select('amount')
    .eq('property_id', params.id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()
  
  const highestBid = highestBidRow?.amount || null

  // Fetch bid history
  const { data: bidHistory } = await supabase
    .from('bids')
    .select('amount, created_at, bidder_id')
    .eq('property_id', params.id)
    .order('amount', { ascending: false })
    .limit(20)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const formatUnit = (unit: string) => {
    if (!unit) return ''
    return unit.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const perUnitPrice = property.reserve_price && property.area_sqft 
    ? property.reserve_price / property.area_sqft 
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/marketplace" className="text-zinc-400 hover:text-white transition-colors flex items-center text-sm font-medium w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-10">
            <ImageGallery images={property.image_urls || []} />
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {property.status === 'approved' && (
                    <span className="text-xs font-semibold text-emerald-950 bg-emerald-400 px-2.5 py-1 rounded uppercase tracking-wider">Live Auction</span>
                  )}
                  {property.status === 'sold' && (
                    <span className="text-xs font-semibold text-white bg-zinc-600 px-2.5 py-1 rounded uppercase tracking-wider">Sold</span>
                  )}
                  {property.status === 'draft' && (
                    <span className="text-xs font-semibold text-amber-900 bg-amber-400 px-2.5 py-1 rounded uppercase tracking-wider">Pending Approval</span>
                  )}
                  <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded uppercase tracking-wider">
                    {property.property_type}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                  {property.title}
                </h1>
                <div className="flex items-center text-zinc-400 text-lg">
                  <MapPin className="w-5 h-5 mr-2 shrink-0 text-zinc-500" />
                  {property.address}, {property.city}, {property.state} {property.pincode}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-zinc-800/80">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm flex items-center"><Expand className="w-4 h-4 mr-1.5" /> Total Area</p>
                  <p className="text-white font-medium text-lg">{property.area_sqft} {formatUnit(property.area_unit)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm flex items-center"><Ruler className="w-4 h-4 mr-1.5" /> Dimensions</p>
                  <p className="text-white font-medium text-lg">{property.length && property.breadth ? `${property.length} x ${property.breadth}` : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm flex items-center"><Compass className="w-4 h-4 mr-1.5" /> Facing</p>
                  <p className="text-white font-medium text-lg">{property.facing || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm flex items-center"><Building2 className="w-4 h-4 mr-1.5" /> Type</p>
                  <p className="text-white font-medium text-lg capitalize">{property.property_type}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">About this property</h3>
                <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </div>
              </div>

              {/* Bid History */}
              {bidHistory && bidHistory.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Bid Activity
                  </h3>
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-3 bg-zinc-900/80 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      <span>Rank</span>
                      <span className="text-right">Bid Amount</span>
                      <span className="text-right">Time</span>
                    </div>
                    {bidHistory.map((bid, idx) => (
                      <div key={idx} className={`grid grid-cols-3 px-5 py-3 border-t border-zinc-800/80 ${idx === 0 ? 'bg-emerald-950/20' : 'bg-zinc-950/30'}`}>
                        <span className={`text-sm font-bold ${idx === 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {idx === 0 ? '🏆 #1' : `#${idx + 1}`}
                        </span>
                        <span className={`text-sm font-bold text-right ${idx === 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {formatCurrency(bid.amount)}
                        </span>
                        <span className="text-xs text-zinc-500 text-right self-center">
                          {new Date(bid.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bidding Console */}
          <div className="lg:col-span-1">
            <BiddingConsole 
              property={property} 
              highestBid={highestBid} 
              hasPaidEmd={hasPaidEmd} 
              isLoggedIn={!!user} 
              userId={user?.id}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
