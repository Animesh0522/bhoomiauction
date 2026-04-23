"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function approveProperty(propertyId: string, emdAmount: number, startTime: string, endTime: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .update({ 
      status: 'approved', 
      emd_amount: emdAmount,
      auction_start_time: startTime,
      auction_end_time: endTime
    })
    .eq('id', propertyId)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Database Row Level Security (RLS) blocked the update, or property not found." }
  
  revalidatePath("/admin/listings")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function rejectProperty(propertyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'rejected' })
    .eq('id', propertyId)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Database Row Level Security (RLS) blocked the update, or property not found." }
  
  revalidatePath("/admin/listings")
  revalidatePath("/dashboard")
  return { success: true }
}
