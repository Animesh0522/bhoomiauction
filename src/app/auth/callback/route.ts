import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    // No code = direct visit to /auth/callback, send to login
    return NextResponse.redirect(`${origin}/login?tab=signin`)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/login?tab=signin&error=link_expired`)
    }

    // Check if user has completed KYC onboarding
    const { data: profile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle()  // won't throw if table is empty

    if (profileErr) {
      // Table may not exist yet OR RLS error — send to onboarding to be safe
      console.error("Profile fetch error:", profileErr.message)
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    if (!profile) {
      // New user — go through KYC onboarding
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    // Returning user with completed profile — go to dashboard
    return NextResponse.redirect(`${origin}/dashboard`)

  } catch (err) {
    console.error("Unexpected auth callback error:", err)
    return NextResponse.redirect(`${origin}/login?tab=signin`)
  }
}
