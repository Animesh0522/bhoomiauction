import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Gavel, MapPin, Calendar, Clock } from "lucide-react"
import EmdRegistrationClient from "./EmdRegistrationClient"

export default async function AuctionRegisterPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch auction / property details
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!property) notFound()

  if (property.status !== "approved") {
    redirect(`/marketplace/${params.id}`)
  }

  const { data: _existingReg } = await supabase
    .from("auction_registrations")
    .select("emd_status")
    .eq("auction_id", params.id)
    .eq("user_id", user.id)
    .single()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  const formatDateTime = (dt: string) =>
    new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      {/* Top Nav */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={`/marketplace/${params.id}`}
            className="text-zinc-400 hover:text-white transition-colors flex items-center text-sm font-medium w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auction
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left: Property Summary */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                <Gavel className="w-3.5 h-3.5" /> Live Auction
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">{property.title}</h1>
              <div className="flex items-center text-sm text-zinc-400 mt-2">
                <MapPin className="w-4 h-4 mr-1.5 text-zinc-500 shrink-0" />
                {property.city}, {property.state}
              </div>
            </div>

            {/* Property Key Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/40 px-4 py-2.5 border-b border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Auction Details</p>
              </div>
              <div className="divide-y divide-zinc-800">
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-zinc-500">Reserve Price</span>
                  <span className="text-white font-semibold">{property.reserve_price ? formatCurrency(property.reserve_price) : "—"}</span>
                </div>
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-zinc-500">EMD Required</span>
                  <span className="text-emerald-400 font-bold">{property.emd_amount ? formatCurrency(property.emd_amount) : "—"}</span>
                </div>
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-zinc-500">Property Type</span>
                  <span className="text-white capitalize">{property.property_type}</span>
                </div>
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-zinc-500">Total Area</span>
                  <span className="text-white">{property.area_sqft} {property.area_unit?.replace("_", " ")}</span>
                </div>
                {property.auction_start_time && (
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Starts</span>
                    <span className="text-zinc-300 text-xs">{formatDateTime(property.auction_start_time)}</span>
                  </div>
                )}
                {property.auction_end_time && (
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Ends</span>
                    <span className="text-zinc-300 text-xs">{formatDateTime(property.auction_end_time)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: EMD Registration Form */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">EMD Registration</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Register your Earnest Money Deposit to participate in this auction.
                </p>
              </div>
              <div className="p-6">
                {!property.emd_amount ? (
                  <div className="py-8 text-center">
                    <p className="text-zinc-400">The admin has not set an EMD amount for this auction yet. Please check back soon.</p>
                  </div>
                ) : (
                  <EmdRegistrationClient
                    auctionId={params.id}
                    propertyTitle={property.title}
                    emdAmount={property.emd_amount}
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
