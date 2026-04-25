import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has completed KYC onboarding
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, kyc_status")
        .eq("user_id", data.user.id)
        .single()

      // New user or incomplete profile → go to onboarding
      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Profile exists → go to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
