import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    /* ======================================================
       1️⃣ DETECT SMS FIRST
    ====================================================== */

    const message =
      payload.text ||
      payload.message ||
      payload.body ||
      null;

    const isSMS = !!message;

    /* ======================================================
       2️⃣ FORCE CANONICAL EVENT TYPE (UI-SAFE)
    ====================================================== */

    const eventType = isSMS ? "SMS" : "CALL";

    /* ======================================================
       3️⃣ NORMALIZE DIRECTION
    ====================================================== */

    const direction =
      payload.direction ||
      payload.call_direction ||
      payload.sms_direction ||
      "Incoming";

    /* ======================================================
       4️⃣ NORMALIZE PHONE NUMBERS
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

    /* ======================================================
       5️⃣ INSERT EVENT
    ====================================================== */

    await supabaseAdmin.from("iplum_events").insert({
      event_type: eventType,   // "SMS" | "CALL"
      direction,               // Incoming | Outgoing
      from_number: from,
      to_number: to,
      message,                 // null for calls
      raw_payload: payload,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ iPlum webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
