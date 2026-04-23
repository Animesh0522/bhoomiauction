import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Plus, Clock, Gavel, TrendingUp, Eye } from "lucide-react"

export default async function SellerListingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch bid counts for all properties
  const propertyIds = properties?.map(p => p.id) || []
  const { data: bidCounts } = propertyIds.length > 0 ? await supabase
    .from('bids')
    .select('property_id')
    .in('property_id', propertyIds) : { data: [] }

  const bidCountMap: Record<string, number> = {}
  bidCounts?.forEach(b => {
    bidCountMap[b.property_id] = (bidCountMap[b.property_id] || 0) + 1
  })

  // Fetch highest bid per property
  const { data: highestBids } = propertyIds.length > 0 ? await supabase
    .from('bids')
    .select('property_id, amount')
    .in('property_id', propertyIds)
    .order('amount', { ascending: false }) : { data: [] }

  const highestBidMap: Record<string, number> = {}
  highestBids?.forEach(b => {
    if (!highestBidMap[b.property_id]) highestBidMap[b.property_id] = b.amount
  })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const formatUnit = (unit: string) => {
    if (!unit) return ''
    return unit.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'Pending Approval', color: 'text-amber-400 bg-amber-950/40 border-amber-900/50' }
      case 'approved': return { label: 'Live Auction', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50' }
      case 'sold': return { label: 'Sold', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' }
      case 'rejected': return { label: 'Rejected', color: 'text-red-400 bg-red-950/40 border-red-900/50' }
      default: return { label: status, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Listings</h1>
            <p className="text-zinc-400 mt-1">Manage your properties and track auction performance.</p>
          </div>
          <Link href="/seller/listings/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              <Plus className="w-4 h-4" /> New Listing
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Listed', value: properties?.length || 0, color: 'text-white' },
            { label: 'Live Auctions', value: properties?.filter(p => p.status === 'approved').length || 0, color: 'text-emerald-400' },
            { label: 'Pending', value: properties?.filter(p => p.status === 'draft').length || 0, color: 'text-amber-400' },
            { label: 'Sold', value: properties?.filter(p => p.status === 'sold').length || 0, color: 'text-zinc-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Listings */}
        {properties && properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => {
              const statusConfig = getStatusConfig(property.status)
              const bids = bidCountMap[property.id] || 0
              const highest = highestBidMap[property.id] || null
              return (
                <Card key={property.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="relative h-44 sm:h-auto sm:w-52 shrink-0 bg-zinc-800">
                        {property.image_urls?.[0] ? (
                          <Image src={property.image_urls[0]} alt={property.title} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">No Image</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white leading-tight">{property.title}</h3>
                            <div className="flex items-center text-sm text-zinc-400 mt-1">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-zinc-500 shrink-0" />
                              {property.address}, {property.city}, {property.state}
                            </div>
                          </div>
                          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Reserve Price</p>
                            <p className="text-sm font-semibold text-white mt-0.5">
                              {property.reserve_price ? formatCurrency(property.reserve_price) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Area</p>
                            <p className="text-sm font-semibold text-white mt-0.5">
                              {property.area_sqft} {formatUnit(property.area_unit)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Gavel className="w-3 h-3" /> Total Bids</p>
                            <p className={`text-sm font-bold mt-0.5 ${bids > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>{bids}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Highest Bid</p>
                            <p className={`text-sm font-bold mt-0.5 ${highest ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {highest ? formatCurrency(highest) : 'No Bids'}
                            </p>
                          </div>
                        </div>

                        {/* Auction Times */}
                        {(property.auction_start_time || property.auction_end_time) && (
                          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-800/80">
                            {property.auction_start_time && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Starts: {new Date(property.auction_start_time).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {property.auction_end_time && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <Clock className="w-3.5 h-3.5 text-red-500" />
                                <span>Ends: {new Date(property.auction_end_time).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* View Link */}
                      {property.status !== 'draft' && (
                        <div className="flex sm:flex-col items-center justify-center p-4 border-t sm:border-t-0 sm:border-l border-zinc-800 sm:min-w-[80px]">
                          <Link href={`/marketplace/${property.id}`} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-emerald-400 transition-colors">
                            <Eye className="w-5 h-5" />
                            <span className="text-xs font-medium">View</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <Gavel className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Listings Yet</h3>
            <p className="text-zinc-400 mb-6">Create your first property listing and start your auction journey.</p>
            <Link href="/seller/listings/new">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create First Listing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
