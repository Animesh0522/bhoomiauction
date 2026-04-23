"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function signOutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return redirect("/login")
}
