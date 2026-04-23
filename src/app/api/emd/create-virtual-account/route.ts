import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user via Supabase
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
    }

    // 2. Parse request body
    const body = await req.json()
    const { auction_id } = body

    if (!auction_id) {
      return NextResponse.json({ error: "auction_id is required." }, { status: 400 })
    }

    // 3. Fetch the property to get the EMD amount
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id, title, emd_amount, status")
      .eq("id", auction_id)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: "Auction not found." }, { status: 404 })
    }

    if (property.status !== "approved") {
      return NextResponse.json({ error: "This auction is not currently active." }, { status: 400 })
    }

    if (!property.emd_amount) {
      return NextResponse.json({ error: "EMD amount has not been set for this auction yet." }, { status: 400 })
    }

    // 4. Check if user already has a virtual account for this auction
    const { data: existingReg } = await supabase
      .from("auction_registrations")
      .select("*")
      .eq("auction_id", auction_id)
      .eq("user_id", user.id)
      .single()

    if (existingReg) {
      // Return the existing account details
      return NextResponse.json({
        already_exists: true,
        virtual_account_id: existingReg.virtual_account_id,
        account_number: existingReg.virtual_account_number,
        ifsc: existingReg.virtual_account_ifsc,
        emd_amount: property.emd_amount,
        emd_status: existingReg.emd_status,
      })
    }

    // 5. Create Razorpay Virtual Account
    const vaPayload = {
      receivers: { types: ["bank_account"] },
      description: `EMD for auction: ${property.title}`,
      amount: property.emd_amount * 100, // in paise
      currency: "INR",
      customer: {
        name: user.email?.split("@")[0] || "Bidder",
        email: user.email || "bidder@platform.com",
        contact: user.phone || "9999999999",
      },
      close_by: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiry
    }

    const va = await razorpay.virtualAccounts.create(vaPayload as any)

    // 6. Extract bank account details from the virtual account
    const bankReceiver = (va.receivers as Array<{ entity: string; account_number: string; ifsc: string }>)?.find((r) => r.entity === "bank_account")
    const accountNumber = bankReceiver?.account_number || va.id
    const ifsc = bankReceiver?.ifsc || "RATN0VAAPIS"

    // 7. Insert into auction_registrations table
    const { error: insertError } = await supabase
      .from("auction_registrations")
      .insert({
        user_id: user.id,
        auction_id: auction_id,
        virtual_account_id: va.id,
        virtual_account_number: accountNumber,
        virtual_account_ifsc: ifsc,
        emd_status: "virtual_account_created",
        emd_amount: property.emd_amount,
      })

    if (insertError) {
      console.error("DB insert error:", insertError)
      return NextResponse.json({ error: "Failed to save registration: " + insertError.message }, { status: 500 })
    }

    // 8. Return account details to frontend
    return NextResponse.json({
      success: true,
      virtual_account_id: va.id,
      account_number: accountNumber,
      ifsc: ifsc,
      emd_amount: property.emd_amount,
    })

  } catch (err: unknown) {
    console.error("Virtual Account creation error:", err)
    const error = err as { error?: { description?: string }; message?: string }
    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to create virtual account." },
      { status: 500 }
    )
  }
}
