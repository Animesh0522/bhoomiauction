import Link from "next/link"
import { ArrowRight, Shield, Zap, TrendingUp, MapPin, BadgeCheck, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import Image from "next/image"

export default async function HomePage() {
  const supabase = createClient()

  // Fetch latest 3 live auctions for the preview section
  const { data: featuredProperties } = await supabase
    .from("properties")
    .select("id, title, city, state, property_type, area_sqft, area_unit, image_urls, reserve_price")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3)

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-zinc-950 font-black text-sm">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Bhoomi<span className="text-emerald-400">Auction</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            {isLoggedIn && (
              <>
                <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
                <Link href="/seller/listings" className="hover:text-white transition-colors">Sell Property</Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
                    Sign Up <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-36 px-4">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Auctions Available Now
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            India&apos;s Most Trusted
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300">
              Real Estate Auction
            </span>
            <br />
            Platform
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Discover verified residential, commercial, and agricultural properties.
            Bid transparently, win confidently — from anywhere in India.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href={isLoggedIn ? "/marketplace" : "/login"}>
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl">
                Explore Live Auctions <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href={isLoggedIn ? "/seller/listings/new" : "/login"}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-semibold border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl">
                List Your Property
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-zinc-500">
            {["100% Verified Listings", "Secure EMD via Bank Transfer", "Real-Time Bidding", "Instant Winner Declaration"].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Properties Auctioned", value: "500+", color: "text-emerald-400" },
            { label: "Registered Bidders", value: "2,000+", color: "text-cyan-400" },
            { label: "Cities Covered", value: "50+", color: "text-emerald-400" },
            { label: "Total Value Transacted", value: "₹500 Cr+", color: "text-cyan-400" },
          ].map(stat => (
            <div key={stat.label}>
              <p className={`text-3xl md:text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Auctions ── */}
      {featuredProperties && featuredProperties.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Live Auctions</h2>
                <p className="text-zinc-400 mt-1">Currently active — bid before time runs out</p>
              </div>
              <Link href={isLoggedIn ? "/marketplace" : "/login"} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProperties.map(property => (
                <Link href={isLoggedIn ? `/marketplace/${property.id}` : "/login"} key={property.id} className="group block">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20">
                    <div className="relative h-52 bg-zinc-800">
                      {property.image_urls?.[0] ? (
                        <Image src={property.image_urls[0]} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">No Image</div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-black animate-pulse" /> Live
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-emerald-400 transition-colors">{property.title}</h3>
                      <div className="flex items-center text-sm text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                        {property.city}, {property.state}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Reserve Price</p>
                          <p className="text-base font-bold text-emerald-400">{property.reserve_price ? formatCurrency(property.reserve_price) : "On Request"}</p>
                        </div>
                        <span className="text-xs font-semibold text-zinc-400 capitalize bg-zinc-800 px-2.5 py-1 rounded-full">{property.property_type}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center sm:hidden">
              <Link href={isLoggedIn ? "/marketplace" : "/login"}>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">View All Auctions</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ── */}
      <section className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">How Bhoomi Auction Works</h2>
            <p className="text-zinc-400 mt-2">A transparent, three-step process built for trust</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Register & Pay EMD", desc: "Create your account and pay the Earnest Money Deposit via secure NEFT/RTGS bank transfer to unlock bidding.", color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40" },
              { icon: Zap, title: "Bid in Real-Time", desc: "Place bids on live properties from anywhere. Watch the countdown, see competing bids, and stay on top with instant updates.", color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/40" },
              { icon: TrendingUp, title: "Win & Proceed", desc: "If your bid wins, we notify you instantly. Your EMD is adjusted against the sale price and next steps are shared.", color: "text-cyan-400", bg: "bg-cyan-950/30 border-cyan-900/40" },
            ].map((step, i) => (
              <div key={i} className={`rounded-2xl border p-6 space-y-4 ${step.bg}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.bg}`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Step {i + 1}</p>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white">
            Ready to bid on your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">dream property?</span>
          </h2>
          <p className="text-zinc-400 text-lg">Join thousands of buyers and sellers on India&apos;s fastest-growing real estate auction platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={isLoggedIn ? "/marketplace" : "/login"}>
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2">
                Start Bidding Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href={isLoggedIn ? "/seller/listings/new" : "/login"}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base font-semibold border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl">
                List a Property
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-zinc-950 font-black text-xs">B</span>
            </div>
            <span className="text-lg font-bold">Bhoomi<span className="text-emerald-400">Auction</span></span>
          </div>
          <p className="text-sm text-zinc-500 text-center">
            © {new Date().getFullYear()} BhoomiAuction.com · Real Estate Auctions, Made Transparent.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href={isLoggedIn ? "/marketplace" : "/login"} className="hover:text-white transition-colors">Marketplace</Link>
            <Link href={isLoggedIn ? "/seller/listings/new" : "/login"} className="hover:text-white transition-colors">Sell</Link>
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
