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

    console.log("📩 IPLUM PAYLOAD:", payload);

    // 🔥 UNIQUE EVENT ID (DEDUP)
    const eventId =
      payload.id ||
      payload.call_id ||
      payload.message_id ||
      `${Date.now()}-${Math.random()}`;

    // 🔥 PREVENT DUPLICATE
    const { data: existingEvent } = await supabaseAdmin
      .from("iplum_events")
      .select("id")
      .eq("external_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log("⏭️ Skipping duplicate:", eventId);
      return NextResponse.json({ ok: true });
    }

    // 🔥 MESSAGE
    const message =
      payload.text ||
      payload.message ||
      payload.body ||
      null;

    // 🔥 SMS DETECTION
    const isSMS =
      payload.type === "sms" ||
      payload.event_type === "sms" ||
      payload.sms === true ||
      !!payload.text ||
      !!payload.message ||
      !!payload.body;

    // 🔥 DIRECTION
    const direction =
      payload.direction ||
      payload.call_direction ||
      payload.sms_direction ||
      "incoming";

    // 🔥 PHONES
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

    // ===============================
    // 🔥 MATCH CUSTOMER FIRST
    // ===============================
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

    // 🔥 NAME
    const name =
      lead?.first_name ||
      invoice?.customer_name ||
      cleanedPhone ||
      "Unknown";

    // ===============================
    // 🔥 EVENT TYPE DETECTION (FIXED)
    // ===============================
    const callStatus =
      payload.status ||
      payload.call_status ||
      payload.event ||
      "";

    let eventType = "UNKNOWN";
    let title = "";
    let bodyText = "";

    if (isSMS) {
      eventType = "SMS";
      title = `New Message from ${name}`;
      bodyText = message || "New message received";
    }

    else if (
      callStatus.toLowerCase().includes("missed") ||
      callStatus.toLowerCase().includes("no-answer")
    ) {
      eventType = "MISSED_CALL";
      title = `Missed Call from ${name}`;
      bodyText = "Missed call";
    }

    else if (direction.toLowerCase().includes("incoming")) {
      eventType = "CALL";
      title = `Incoming Call from ${name}`;
      bodyText = "Call received";
    }

    else if (direction.toLowerCase().includes("outgoing")) {
      eventType = "OUTGOING_CALL";
      title = `Outgoing Call to ${name}`;
      bodyText = "Call placed";
    }

    else {
      eventType = "CALL";
      title = `Call Activity from ${name}`;
      bodyText = "Call event";
    }

    // ===============================
    // 🔥 SAVE EVENT (NOW CORRECT)
    // ===============================
    await supabaseAdmin.from("iplum_events").insert({
      external_id: eventId,
      event_type: eventType,
      direction,
      from_number: from,
      to_number: to,
      phone_clean: cleanedPhone,
      message,
      raw_payload: payload,
    });

    // ===============================
    // 🔥 SEND NOTIFICATIONS
    // ===============================
    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("id, active_company_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const rows = admins.map((admin) => ({
        title,
        body: bodyText,
        type: eventType,

        entity_type: matchType,
        entity_id: lead?.id || invoice?.id || null,

        is_read: false,
        created_at: new Date().toISOString(),

        recipient_user_id: admin.id,
        company_id: admin.active_company_id || null,
      }));

      await supabaseAdmin.from("notifications").insert(rows);
    }

    console.log("🔔 Notification:", title);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("❌ iPlum webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}