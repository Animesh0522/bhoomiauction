"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export function AuthGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const checkProfileAndRedirect = async (session: any) => {
      if (!session?.user || !isMounted) return

      try {
        // Fallback: Check metadata first for instant routing
        const isPendingKycMeta = session.user.user_metadata?.kyc_status === "pending"
        if (isPendingKycMeta && pathname !== "/onboarding") {
          router.push("/onboarding")
          return
        }

        // Always verify with DB to be completely sure (catches old users and edge cases)
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("kyc_status")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (!isMounted) return

        const isMissingOrPending = !profile || profile.kyc_status === "pending"
        
        if (isMissingOrPending && pathname !== "/onboarding") {
          router.push("/onboarding")
        } else if (!isMissingOrPending && pathname === "/" && typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          // They just logged in via magic link hash on home page, and have completed KYC
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("AuthGuard error:", err)
      }
    }

    // 1. Check session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkProfileAndRedirect(session)
    })

    // 2. Listen to auth state changes (catches the magic link hash parsing)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) checkProfileAndRedirect(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname, supabase.auth])

  return null
}
