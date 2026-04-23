"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function payEmd(propertyId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "You must be logged in to pay EMD." }

  // Simulate payment success and insert into participants
  const { error } = await supabase
    .from('auction_participants')
    .insert({
      property_id: propertyId,
      user_id: user.id,
      emd_paid: true
    })

  if (error) {
    if (error.code === '23505') return { error: "You have already paid the EMD for this auction." }
    return { error: error.message }
  }

  revalidatePath(`/marketplace/${propertyId}`)
  return { success: true }
}

export async function placeBid(propertyId: string, amount: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "You must be logged in to bid." }

  // Validate EMD
  const { data: participant } = await supabase
    .from('auction_participants')
    .select('*')
    .eq('property_id', propertyId)
    .eq('user_id', user.id)
    .single()

  if (!participant || !participant.emd_paid) {
    return { error: "You must pay the EMD before placing a bid." }
  }

  // Fetch property and highest bid to validate amount
  const { data: property } = await supabase.from('properties').select('reserve_price').eq('id', propertyId).single()
  const { data: highestBidRow } = await supabase.from('bids').select('amount').eq('property_id', propertyId).order('amount', { ascending: false }).limit(1).single()

  const currentHighest = highestBidRow ? highestBidRow.amount : (property?.reserve_price || 0)

  if (amount <= currentHighest) {
    return { error: `Your bid must be higher than ₹${currentHighest.toLocaleString()}` }
  }

  const { error } = await supabase
    .from('bids')
    .insert({
      property_id: propertyId,
      bidder_id: user.id,
      amount: amount
    })

  if (error) return { error: error.message }

  revalidatePath(`/marketplace/${propertyId}`)
  return { success: true }
}

export async function closeAuction(propertyId: string) {
  const supabase = createClient()
  
  // Verify it is actually ended and still 'approved'
  const { data: property } = await supabase
    .from('properties')
    .select('status, auction_end_time')
    .eq('id', propertyId)
    .single()

  if (!property || property.status !== 'approved' || !property.auction_end_time) return { success: false }
  
  const now = new Date().getTime()
  const end = new Date(property.auction_end_time).getTime()
  
  if (now <= end) return { success: false }

  // Get highest bid
  const { data: highestBid } = await supabase
    .from('bids')
    .select('bidder_id')
    .eq('property_id', propertyId)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  const winnerId = highestBid ? highestBid.bidder_id : null

  const { error } = await supabase
    .from('properties')
    .update({ 
      status: 'sold', 
      winner_id: winnerId 
    })
    .eq('id', propertyId)

  if (error) return { error: error.message }
  
  revalidatePath(`/marketplace/${propertyId}`)
  revalidatePath(`/dashboard`)
  return { success: true }
}
