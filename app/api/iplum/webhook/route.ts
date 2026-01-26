import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    console.log("📞 RAW IPLUM PAYLOAD ↓↓↓");
    console.log(JSON.stringify(payload, null, 2));

    await supabaseAdmin.from("iplum_events").insert({
      event_type: payload.event_type ?? payload.type ?? payload.event ?? "unknown",
      direction: payload.direction ?? null,
      from_number:
        payload.from ??
        payload.from_number ??
        payload.caller ??
        payload.data?.from ??
        null,
      to_number:
        payload.to ??
        payload.to_number ??
        payload.callee ??
        payload.data?.to ??
        null,
      message:
        payload.message ??
        payload.text ??
        payload.body ??
        payload.data?.text ??
        null,
      raw_payload: payload,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ iPlum webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
