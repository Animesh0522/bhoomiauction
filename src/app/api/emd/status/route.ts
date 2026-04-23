import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const auctionId = req.nextUrl.searchParams.get("auction_id")
    if (!auctionId) return NextResponse.json({ error: "auction_id required" }, { status: 400 })

    const { data: reg } = await supabase
      .from("auction_registrations")
      .select("emd_status, amount_received, virtual_account_number, virtual_account_ifsc, emd_amount")
      .eq("auction_id", auctionId)
      .eq("user_id", user.id)
      .single()

    if (!reg) return NextResponse.json({ emd_status: "not_registered" })

    return NextResponse.json(reg)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
