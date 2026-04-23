import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Gavel, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  // Fetch listed properties count
  const { count: propertiesCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user?.id)

  // Fetch recent properties listed by user
  const { data: recentProperties } = await supabase
    .from('properties')
    .select('id, title, created_at, status')
    .eq('seller_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch EMD Balance
  const { data: participantsData } = await supabase
    .from('auction_participants')
    .select(`
      property_id,
      properties ( emd_amount )
    `)
    .eq('user_id', user?.id)
  
  let totalEmd = 0
  if (participantsData) {
    totalEmd = participantsData.reduce((acc, curr: { properties?: { emd_amount?: number } }) => {
      const amount = curr.properties?.emd_amount || 0
      return acc + Number(amount)
    }, 0)
  }

  // Fetch Active Bids count (unique properties)
  const { data: bidsData } = await supabase
    .from('bids')
    .select('property_id')
    .eq('bidder_id', user?.id)
  
  const uniqueBiddedPropertiesCount = new Set(bidsData?.map(b => b.property_id)).size

  // Fetch recent bids for activity
  const { data: recentBidsData } = await supabase
    .from('bids')
    .select(`
      amount,
      created_at,
      properties ( id, title, status )
    `)
    .eq('bidder_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(15)

  // Deduplicate to show the highest/latest bid per property
  const recentBidsMap = new Map();
  if (recentBidsData) {
    recentBidsData.forEach((bid: any) => {
      const propId = bid.properties?.id;
      if (propId && !recentBidsMap.has(propId)) {
        recentBidsMap.set(propId, bid);
      }
    });
  }
  const recentBidsList = Array.from(recentBidsMap.values()).slice(0, 3);

  // Fetch Won Auctions
  const { data: wonPropertiesData } = await supabase
    .from('properties')
    .select('id, title, auction_end_time')
    .eq('winner_id', user?.id)
    .order('auction_end_time', { ascending: false })

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back!</h1>
        <p className="text-zinc-400">
          Manage your properties, active bids, and account settings from your unified dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400">Active Auctions</CardTitle>
            <Gavel className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueBiddedPropertiesCount}</div>
            <p className="text-xs text-zinc-500 mt-1">Auctions you are bidding in</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-400">EMD Balance</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalEmd)}</div>
            <p className="text-xs text-zinc-500 mt-1">Total locked in active EMDs</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">Listed Properties</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{propertiesCount || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Properties you are selling</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Your Bidding Activity</CardTitle>
            <CardDescription className="text-zinc-400">Properties you are currently fighting for</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBidsList && recentBidsList.length > 0 ? (
              <div className="space-y-4">
                {recentBidsList.map((bid, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/marketplace/${bid.properties.id}`} className="text-sm font-medium text-white hover:text-emerald-400 transition-colors">
                        {bid.properties.title}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-1">
                        Your highest bid: <span className="text-emerald-400 font-semibold">{formatCurrency(bid.amount)}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-xs px-2 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 capitalize font-medium mb-1">
                        {bid.properties.status === 'approved' ? 'Live' : bid.properties.status}
                      </div>
                      <Link href={`/marketplace/${bid.properties.id}`} className="text-xs text-zinc-400 hover:text-white flex items-center">
                        View <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 py-8 text-center border border-dashed border-zinc-800 rounded-lg">
                You haven&apos;t placed any bids yet. Head to the Marketplace!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Your Listed Properties</CardTitle>
            <CardDescription className="text-zinc-400">Properties you are selling on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProperties && recentProperties.length > 0 ? (
              <div className="space-y-4">
                {recentProperties.map((prop, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-white">{prop.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Listed on {new Date(prop.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 capitalize font-medium">
                      {prop.status === 'draft' ? 'Pending Approval' : prop.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 py-8 text-center border border-dashed border-zinc-800 rounded-lg">
                No properties listed. Create your first listing to start selling!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="bg-emerald-950/20 border-emerald-900/50 text-white shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="text-emerald-400">🏆 Your Won Auctions</CardTitle>
            <CardDescription className="text-zinc-400">Properties you have successfully won on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {wonPropertiesData && wonPropertiesData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wonPropertiesData.map((prop, idx) => (
                  <Link key={idx} href={`/marketplace/${prop.id}`} className="block p-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 hover:bg-emerald-900/30 transition-colors">
                    <p className="font-semibold text-emerald-300 truncate">{prop.title}</p>
                    <p className="text-xs text-zinc-400 mt-2">Won on {prop.auction_end_time ? new Date(prop.auction_end_time).toLocaleDateString() : 'Unknown'}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 py-6 text-center border border-dashed border-emerald-900/30 rounded-lg">
                You haven&apos;t won any auctions yet. Keep bidding!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
