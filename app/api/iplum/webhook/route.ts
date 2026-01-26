import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 🔍 Normalize iPlum event type
    const eventType =
      payload.type ||
      payload.event ||
      payload.event_type ||
      payload.call_type ||
      "unknown";

    // 🔁 Normalize direction
    const direction =
      payload.direction ||
      payload.call_direction ||
      (eventType.includes("in") ? "inbound" : "outbound");

    // 📞 Normalize phone numbers
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

    // 💬 Normalize message (SMS only)
    const message =
      payload.text ||
      payload.message ||
      payload.body ||
      null;

    await supabaseAdmin.from("iplum_events").insert({
      event_type: eventType,
      direction,
      from_number: from,
      to_number: to,
      message,
      raw_payload: payload,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ iPlum webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
