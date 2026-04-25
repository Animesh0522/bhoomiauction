import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has a role set (returning user) or not (new user)
      const role = data.user.user_metadata?.role
      const redirectTo = role ? "/dashboard" : "/onboarding"
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // If something went wrong, send to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
