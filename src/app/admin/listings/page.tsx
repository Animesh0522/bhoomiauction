import { createClient } from "@/utils/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, User, CheckCircle } from "lucide-react"
import { PropertyActions } from "./PropertyActions"
import Image from "next/image"

export default async function AdminListingsPage() {
  const supabase = createClient()

  // Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch 'draft' properties and join with users table
  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      users (
        full_name,
        mobile
      )
    `)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  const formatUnit = (unit: string) => {
    if (!unit) return ''
    return unit.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Approval Dashboard</h1>
          <p className="text-zinc-400">Review and moderate newly submitted property listings.</p>
        </div>

        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
                <div className="flex overflow-x-auto gap-2 p-4 bg-zinc-950/50">
                  {property.image_urls && property.image_urls.length > 0 ? (
                    property.image_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative h-24 w-24 shrink-0 rounded-md overflow-hidden border border-zinc-800 hover:opacity-80 transition-opacity">
                        <Image src={url} alt={`Property Image ${i + 1}`} fill className="object-cover" />
                      </a>
                    ))
                  ) : (
                    <div className="h-24 w-full flex items-center justify-center text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-md">
                      No Images
                    </div>
                  )}
                </div>

                <CardContent className="p-5 flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-white leading-tight">{property.title}</h3>
                      {property.reserve_price && (
                        <div className="text-right ml-4 shrink-0 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded-lg">
                          <span className="block text-emerald-500/70 text-[10px] uppercase tracking-wider font-bold">Reserve Price</span>
                          <span className="text-emerald-400 font-bold text-lg">{formatCurrency(property.reserve_price)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start text-sm text-zinc-400 mt-2">
                      <MapPin className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                      <span>{property.address}, {property.city}, {property.state} {property.pincode}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm border-y border-zinc-800 py-3">
                    <div>
                      <span className="block text-zinc-500 text-xs uppercase tracking-wider">Type</span>
                      <span className="text-zinc-200 capitalize">{property.property_type}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-xs uppercase tracking-wider">Total Area</span>
                      <span className="text-zinc-200">{property.area_sqft} {formatUnit(property.area_unit)}</span>
                    </div>
                    {property.length && property.breadth && (
                      <div>
                        <span className="block text-zinc-500 text-xs uppercase tracking-wider">Dimensions</span>
                        <span className="text-zinc-200">{property.length} x {property.breadth}</span>
                      </div>
                    )}
                    {property.facing && (
                      <div>
                        <span className="block text-zinc-500 text-xs uppercase tracking-wider">Facing</span>
                        <span className="text-zinc-200">{property.facing}</span>
                      </div>
                    )}
                  </div>

                  {property.description && (
                    <div className="text-sm text-zinc-400 line-clamp-3 bg-zinc-950/30 p-3 rounded-lg border border-zinc-800/50">
                      {property.description}
                    </div>
                  )}

                  <div className="bg-zinc-950/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Seller Details</p>
                    <div className="flex items-center text-sm text-zinc-300">
                      <User className="h-4 w-4 mr-2 text-zinc-500" />
                      {/* @ts-expect-error - nested join type bypass */}
                      {property.users?.full_name || 'Anonymous User'}
                    </div>
                    <div className="flex items-center text-sm text-zinc-300">
                      <Phone className="h-4 w-4 mr-2 text-zinc-500" />
                      {/* @ts-expect-error - nested join type bypass */}
                      {property.users?.mobile || 'No Mobile Provided'}
                    </div>
                  </div>
                </CardContent>

                <PropertyActions propertyId={property.id} reservePrice={property.reserve_price} />
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
            <CheckCircle className="h-12 w-12 text-emerald-500/50 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-zinc-400 max-w-md">
              There are currently no new properties awaiting review. Everything is approved or rejected.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
