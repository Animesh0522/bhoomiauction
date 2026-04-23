import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Use service role client for webhook (bypasses RLS, trusted server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-razorpay-signature")
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    // 1. Verify webhook signature (security — prevents fake payloads)
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex")

      if (expectedSignature !== signature) {
        console.error("Webhook signature mismatch")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    const event = payload.event

    console.log("Razorpay webhook received:", event)

    // 2. Handle virtual account credited event
    if (event === "virtual_account.credited") {
      const va = payload.payload?.virtual_account?.entity
      const payment = payload.payload?.payment?.entity

      if (!va || !payment) {
        return NextResponse.json({ error: "Missing payload data" }, { status: 400 })
      }

      const virtualAccountId = va.id
      const amountPaid = payment.amount / 100 // Convert paise to rupees

      console.log(`VA ${virtualAccountId} credited with ₹${amountPaid}`)

      // 3. Find the registration record
      const { data: registration, error: regError } = await supabaseAdmin
        .from("auction_registrations")
        .select("*")
        .eq("virtual_account_id", virtualAccountId)
        .single()

      if (regError || !registration) {
        console.error("Registration not found for VA:", virtualAccountId)
        return NextResponse.json({ error: "Registration not found" }, { status: 404 })
      }

      // 4. Validate payment amount matches EMD
      const expectedAmount = registration.emd_amount
      const amountMatches = Math.abs(amountPaid - expectedAmount) < 1 // allow ₹1 tolerance

      const newStatus = amountMatches ? "emd_received" : "amount_mismatch"

      // 5. Update registration status
      await supabaseAdmin
        .from("auction_registrations")
        .update({
          emd_status: newStatus,
          payment_id: payment.id,
          amount_received: amountPaid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", registration.id)

      // 6. If correct amount, also unlock bidding in auction_participants
      if (amountMatches) {
        // Check if already exists
        const { data: existingParticipant } = await supabaseAdmin
          .from("auction_participants")
          .select("id")
          .eq("property_id", registration.auction_id)
          .eq("user_id", registration.user_id)
          .single()

        if (!existingParticipant) {
          await supabaseAdmin
            .from("auction_participants")
            .insert({
              property_id: registration.auction_id,
              user_id: registration.user_id,
              emd_paid: true,
            })
        } else {
          await supabaseAdmin
            .from("auction_participants")
            .update({ emd_paid: true })
            .eq("id", existingParticipant.id)
        }

        console.log(`✅ EMD confirmed for user ${registration.user_id} on auction ${registration.auction_id}`)
      } else {
        console.warn(`⚠️ Amount mismatch: expected ₹${expectedAmount}, received ₹${amountPaid}`)
      }
    }

    // 3. Handle virtual account closed event
    if (event === "virtual_account.closed") {
      const va = payload.payload?.virtual_account?.entity
      if (va?.id) {
        await supabaseAdmin
          .from("auction_registrations")
          .update({ emd_status: "va_closed" })
          .eq("virtual_account_id", va.id)
          .eq("emd_status", "virtual_account_created") // only update if not already paid
      }
    }

    return NextResponse.json({ received: true, event })
  } catch (err: any) {
    console.error("Webhook error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
