"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function approveKyc(userId: string) {
  const supabase = createClient()
  
  // 1. Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
    
  const { data: adminCheck } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
    
  if (adminCheck?.role !== "admin") throw new Error("Unauthorized")

  // 2. Call RPC to update user auth metadata securely (kyc_status = 'verified')
  const { error: rpcError } = await supabase.rpc("admin_update_kyc_status", {
    p_user_id: userId,
    p_status: "verified"
  })

  if (rpcError) throw new Error(`Failed to update auth metadata: ${rpcError.message}`)

  // 3. Update user_profiles table
  const { error: dbError } = await supabase
    .from("user_profiles")
    .update({ kyc_status: "verified", kyc_notes: null })
    .eq("user_id", userId)

  if (dbError) throw new Error(`Failed to update profile: ${dbError.message}`)

  revalidatePath("/admin/kyc")
  revalidatePath(`/admin/kyc/${userId}`) // assuming profile.id or user_id, in page.tsx we pass profile.id. Wait, profile.id is UUID of the profile, user_id is UUID of the user. We need to pass user_id to RPC.
}

export async function rejectKyc(userId: string, reason: string) {
  const supabase = createClient()
  
  // 1. Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
    
  const { data: adminCheck } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
    
  if (adminCheck?.role !== "admin") throw new Error("Unauthorized")

  // 2. Call RPC to update user auth metadata securely (kyc_status = 'rejected')
  const { error: rpcError } = await supabase.rpc("admin_update_kyc_status", {
    p_user_id: userId,
    p_status: "rejected"
  })

  if (rpcError) throw new Error(`Failed to update auth metadata: ${rpcError.message}`)

  // 3. Update user_profiles table
  const { error: dbError } = await supabase
    .from("user_profiles")
    .update({ kyc_status: "rejected", kyc_notes: reason })
    .eq("user_id", userId)

  if (dbError) throw new Error(`Failed to update profile: ${dbError.message}`)

  revalidatePath("/admin/kyc")
}
