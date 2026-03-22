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

    // 🔥 UNIQUE EVENT ID (IMPORTANT FOR DEDUPE)
    const eventId =
      payload.id ||
      payload.call_id ||
      payload.message_id ||
      `${Date.now()}-${Math.random()}`;

    // 🔥 PREVENT DUPLICATE PROCESSING
    const { data: existingEvent } = await supabaseAdmin
      .from("iplum_events")
      .select("id")
      .eq("external_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log("⏭️ Skipping duplicate event:", eventId);
      return NextResponse.json({ ok: true });
    }

    // 🔥 1. SMS or CALL
    const message =
      payload.text ||
      payload.message ||
      payload.body ||
      null;

    const isSMS = !!message;
    const eventType = isSMS ? "SMS" : "CALL";

    // 🔥 2. Direction
    const direction =
      payload.direction ||
      payload.call_direction ||
      payload.sms_direction ||
      "Incoming";

    // 🔥 3. Phones
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

    // 🔥 4. Save event (WITH external_id)
    await supabaseAdmin.from("iplum_events").insert({
      external_id: eventId,
      event_type: eventType,
      direction,
      from_number: from,
      to_number: to,
      message,
      raw_payload: payload,
    });

    // 🔥 5. Match customer
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

    // 🔥 6. Name + Title (FIXED)
    const name =
      lead?.first_name ||
      invoice?.customer_name ||
      "Unknown Caller";

    const title =
      eventType === "SMS"
        ? `New Message from ${name}`
        : `Missed Call from ${name}`;

  // 🔥 7. GET ALL ADMINS
const { data: admins, error: adminsError } = await supabaseAdmin
  .from("profiles")
  .select("id, active_company_id")
  .eq("role", "admin");

if (adminsError) {
  console.error("❌ ADMIN FETCH FAILED:", adminsError);
} else if (!admins || admins.length === 0) {
  console.error("❌ No admin profiles found");
} else {
  // 🔥 8. INSERT NOTIFICATIONS FOR ALL ADMINS
  const rows = admins.map((admin) => ({
    title,
    body: message || `Missed call from ${name}`,

    entity_type: matchType,
    entity_id: lead?.id || invoice?.id || null,

    is_read: false,
    created_at: new Date().toISOString(),

    recipient_user_id: admin.id,
    company_id: admin.active_company_id || null,
  }));

  const { data: notifData, error: notifError } = await supabaseAdmin
    .from("notifications")
    .insert(rows)
    .select();

  if (notifError) {
    console.error("❌ NOTIFICATION INSERT FAILED:", notifError);
  } else {
    console.log("✅ NOTIFICATION INSERTED:", notifData);
  }
}

    console.log("🔔 Notification created:", title);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ iPlum webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}