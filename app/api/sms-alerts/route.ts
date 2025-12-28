import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("partner_sms_subscriptions")
      .insert({
        name,
        email,
        phone,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
