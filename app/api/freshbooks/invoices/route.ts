import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    /* 1️⃣ Get FreshBooks access token from Supabase */
    const { data: tokenRow, error } = await supabaseAdmin
      .from("freshbooks_tokens")
      .select("access_token")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !tokenRow?.access_token) {
      return NextResponse.json(
        { error: "FreshBooks access token not found" },
        { status: 401 }
      );
    }

    const ACCESS_TOKEN = tokenRow.access_token;
    /* 2️⃣ Fetch invoices from FreshBooks */
    const res = await fetch(
      "https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices",
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: errText },
        { status: res.status }
      );
    }

    const json = await res.json();

    /* 3️⃣ Return invoices to TradePilot */
    return NextResponse.json({
      success: true,
      invoices: json.response?.result?.invoices || [],
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
