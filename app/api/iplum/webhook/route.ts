import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    /* ======================================================
       1️⃣ DETECT SMS FIRST (THIS FIXES THE BUG)
    ====================================================== */

    const message =
      payload.text ||
      payload.message ||
      payload.body ||
      null;

    const isSMS = !!message;

    /* ======================================================
       2️⃣ NORMALIZE EVENT TYPE (SMS WINS)
    ====================================================== */

    const eventType = isSMS
      ? "sms"
      : payload.type ||
        payload.event ||
        payload.event_type ||
        payload.call_type ||
        "call";

    /* ======================================================
       3️⃣ NORMALIZE DIRECTION (SAFE + SIMPLE)
    ====================================================== */

    const direction =
      payload.direction ||
      payload.call_direction ||
      payload.sms_direction ||
      "inbound";

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
      event_type: eventType,   // "sms" | "call"
      direction,               // inbound | outbound
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
