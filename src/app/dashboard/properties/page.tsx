import { createClient } from "@/utils/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Expand, BadgeCheck, Clock, XCircle, Plus, Image as ImageIcon, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function PropertiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch all properties owned by the seller
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Helper to format Area Unit text
  const formatUnit = (unit: string) => {
    return unit.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
      case 'approved':
        return <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full"><BadgeCheck className="w-3 h-3 mr-1" /> Approved</span>
      case 'draft':
        return <span className="flex items-center text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full"><Clock className="w-3 h-3 mr-1" /> Pending Approval</span>
      case 'rejected':
        return <span className="flex items-center text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>
      default:
        return <span className="flex items-center text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full capitalize">{status}</span>
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Properties</h1>
          <p className="text-zinc-400">Manage your property listings and view their auction status.</p>
        </div>
        <Link href="/seller/listings/new">
          <Button className="bg-white text-zinc-950 hover:bg-zinc-200">
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="relative h-48 w-full bg-zinc-800">
                {property.image_urls && property.image_urls.length > 0 ? (
                  <Image 
                    src={property.image_urls[0]} 
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Image Provided</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 z-10">
                  <StatusBadge status={property.status} />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{property.title}</h3>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-start text-sm text-zinc-400">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-zinc-500" />
                    <span className="line-clamp-2">{property.address}, {property.city}, {property.state} {property.pincode}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-zinc-400">
                    <Expand className="h-4 w-4 mr-2 text-zinc-500" />
                    <span>{property.area_sqft} {formatUnit(property.area_unit)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mt-4">
                    <span className="text-xs text-zinc-500 capitalize bg-zinc-800 px-2 py-1 rounded">
                      {property.property_type}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Listed on {new Date(property.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
          <div className="bg-zinc-800/50 p-4 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Properties Listed Yet</h3>
          <p className="text-zinc-400 max-w-md mb-6">
            You haven&apos;t added any properties to your portfolio. Start by creating a new listing to put your property up for auction.
          </p>
          <Link href="/seller/listings/new">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-200">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Listing
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
