"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Building2, Store, ShieldCheck, Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export function Navbar({ phoneNumber }: { phoneNumber?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 mr-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-zinc-950 font-black text-xs">B</span>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Bhoomi<span className="text-emerald-400">Auction</span>
          </span>
        </Link>
        
        {isLoggedIn ? (
          <>
            <div className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium text-zinc-400 mr-6">
              <Link href="/marketplace" className="transition-colors hover:text-white flex items-center gap-2">
                <Store className="h-4 w-4" />
                Marketplace
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-white flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/seller/listings" className="transition-colors hover:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                My Listings
              </Link>
              <Link href="/seller/listings/new" className="transition-colors hover:text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                List Property
              </Link>
              <Link href="/admin/listings" className="transition-colors hover:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {phoneNumber && (
                <span className="text-sm text-zinc-400">
                  {phoneNumber}
                </span>
              )}
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm" 
                className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-end flex-1">
            <Link href="/login">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Sign In / Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
