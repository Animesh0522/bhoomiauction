"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export function AuthGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // When a session is established (either via cookie or by parsing the URL hash like #access_token=...)
      if (session?.user) {
        const isPendingKyc = session.user.user_metadata?.kyc_status === "pending"
        
        // If they have pending KYC, force them to onboarding
        if (isPendingKyc && pathname !== "/onboarding") {
          router.push("/onboarding")
        }
        // If they are on the home page, have no pending KYC, and have a magic link hash, send to dashboard
        else if (!isPendingKyc && pathname === "/" && typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          router.push("/dashboard")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname, supabase.auth])

  return null
}
