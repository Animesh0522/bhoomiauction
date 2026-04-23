import { createClient } from "@/utils/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Expand, BadgeCheck, Flame, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import MarketplaceFilters from "./MarketplaceFilters"

export default async function MarketplacePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = createClient()

  const search = searchParams?.search || ''
  const type = searchParams?.type || ''
  const city = searchParams?.city || ''
  const minPrice = searchParams?.minPrice ? Number(searchParams.minPrice) : null
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : null

  let query = supabase
    .from('properties')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)
  if (type) query = query.eq('property_type', type)
  if (city) query = query.ilike('city', `%${city}%`)
  if (minPrice) query = query.gte('reserve_price', minPrice)
  if (maxPrice) query = query.lte('reserve_price', maxPrice)

  const { data: properties } = await query

  // Fetch highest bids for all these properties  
  const ids = properties?.map(p => p.id) || []
  const { data: highestBids } = ids.length > 0 ? await supabase
    .from('bids')
    .select('property_id, amount')
    .in('property_id', ids)
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

  const hasActiveFilters = search || type || city || minPrice || maxPrice

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto text-center space-y-5">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Premium Real Estate <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Auctions</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-zinc-400">
            Browse verified, premium properties. Find your next investment and bid with confidence.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Filters Bar */}
        <MarketplaceFilters currentSearch={search} currentType={type} currentCity={city} currentMinPrice={searchParams?.minPrice || ''} currentMaxPrice={searchParams?.maxPrice || ''} />

        {/* Results header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Flame className="w-5 h-5 mr-2 text-orange-500" />
            {hasActiveFilters ? 'Filtered Results' : 'Live & Upcoming Auctions'}
          </h2>
          <span className="text-sm font-medium text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
            {properties?.length || 0} {properties?.length === 1 ? 'Property' : 'Properties'}
          </span>
        </div>

        {/* Property Grid */}
        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => {
              return (
                <Link href={`/marketplace/${property.id}`} key={property.id} className="block group">
                  <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 shadow-lg hover:shadow-emerald-900/20 h-full flex flex-col">
                    <div className="relative h-52 w-full bg-zinc-800 overflow-hidden">
                      {property.image_urls?.[0] ? (
                        <Image 
                          src={property.image_urls[0]} 
                          alt={property.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">No Image</div>
                      )}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="flex items-center text-[10px] uppercase tracking-wider font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-sm border border-white/10">
                          <BadgeCheck className="w-3 h-3 mr-1 text-emerald-400" /> Verified
                        </span>
                      </div>
                      {highestBid && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Current Bid</p>
                          <p className="text-lg font-bold text-white">{formatCurrency(highestBid)}</p>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">{property.title}</h3>
                      
                      <div className="space-y-1.5 mt-auto">
                        <div className="flex items-center text-sm text-zinc-400">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-zinc-500 shrink-0" />
                          <span className="line-clamp-1">{property.city}, {property.state}</span>
                        </div>
                        <div className="flex items-center text-sm text-zinc-400">
                          <Expand className="h-3.5 w-3.5 mr-1.5 text-zinc-500 shrink-0" />
                          <span>{property.area_sqft} {formatUnit(property.area_unit)}</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-zinc-800/80 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{highestBid ? 'Reserve' : 'Reserve Price'}</p>
                          <p className="text-sm font-bold text-zinc-300">{property.reserve_price ? formatCurrency(property.reserve_price) : '—'}</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                          Bid Now →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No properties found</h3>
            <p className="text-zinc-400">Try adjusting your filters or check back later for new listings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
