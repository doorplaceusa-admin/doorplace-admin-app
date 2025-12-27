import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    /* 1️⃣ Get latest FreshBooks access token */
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
    const ACCOUNT_ID = process.env.FRESHBOOKS_ACCOUNT_ID;

    if (!ACCOUNT_ID) {
      return NextResponse.json(
        { error: "FRESHBOOKS_ACCOUNT_ID missing" },
        { status: 500 }
      );
    }

    /* 2️⃣ Fetch invoices */
    const res = await fetch(
      `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices`,
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

    /* 3️⃣ Return invoices */
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
