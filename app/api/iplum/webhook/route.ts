import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 🔹 Clean phone
function cleanPhone(phone: string | null) {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  if (digits.length === 10) {
    return digits;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    /* ======================================================
       1️⃣ DETECT SMS OR CALL
    ====================================================== */

    const message =
      payload.text ||
      payload.message ||
      payload.body ||
      null;

    const isSMS = !!message;
    const eventType = isSMS ? "SMS" : "CALL";

    /* ======================================================
       2️⃣ DIRECTION
    ====================================================== */

    const direction =
      payload.direction ||
      payload.call_direction ||
      payload.sms_direction ||
      "Incoming";

    /* ======================================================
       3️⃣ PHONE NUMBERS
    ====================================================== */

    const from =
      payload.from_number ||
      payload.from ||
      payload.caller ||
      payload.external_number ||
      null;

    const to =
      payload.to_number ||
      payload.to ||
      payload.callee ||
      payload.internal_number ||
      null;

    const cleanedPhone = cleanPhone(from || to);

    /* ======================================================
       4️⃣ INSERT EVENT (existing)
    ====================================================== */

    const { data: inserted } = await supabaseAdmin
      .from("iplum_events")
      .insert({
        event_type: eventType,
        direction,
        from_number: from,
        to_number: to,
        message,
        raw_payload: payload,
      })
      .select()
      .single();

    /* ======================================================
       5️⃣ MATCH CUSTOMER
    ====================================================== */

    let lead = null;
    let invoice = null;
    let matchType: "lead" | "invoice" | "unknown" = "unknown";

    if (cleanedPhone) {
      const { data: leadData } = await supabaseAdmin
        .from("leads")
        .select("*")
        .eq("phone_clean", cleanedPhone)
        .maybeSingle();

      if (leadData) {
        lead = leadData;
        matchType = "lead";
      } else {
        const { data: invoiceData } = await supabaseAdmin
          .from("invoices")
          .select("*")
          .eq("phone_clean", cleanedPhone)
          .maybeSingle();

        if (invoiceData) {
          invoice = invoiceData;
          matchType = "invoice";
        }
      }
    }

    /* ======================================================
       6️⃣ BUILD NOTIFICATION
    ====================================================== */

    const name =
      lead?.first_name ||
      invoice?.customer_name ||
      "Unknown Caller";

    const title =
      eventType === "CALL"
        ? `Missed Call from ${name}`
        : `New Message from ${name}`;

    /* ======================================================
       7️⃣ INSERT NOTIFICATION 🔔
    ====================================================== */

    await supabaseAdmin.from("notifications").insert({
      title,
      type: eventType.toLowerCase(), // "call" or "sms"
      recipient_user_id: null, // 🔥 we'll fix later if needed
      company_id: null,        // 🔥 same here (optional)
      is_read: false,
      created_at: new Date().toISOString(),

      // 🔥 EXTRA DATA (IMPORTANT)
      metadata: {
        phone: cleanedPhone,
        raw_phone: from || to,
        name,
        match_type: matchType,
        lead_id: lead?.id || null,
        invoice_id: invoice?.id || null,
        message,
      },
    });

    console.log("🔔 Notification created:", title);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ iPlum webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}