import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";


export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();

    const body = await req.json();

    /* ===============================
       1️⃣ READ GLOBAL APPROVAL MODE
    =============================== */
    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("approval_mode")
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: "System settings not found" },
        { status: 500 }
      );
    }

    const approvalMode: "manual" | "automatic" = settings.approval_mode;

    /* ===============================
       2️⃣ INSERT PARTNER (DEFAULT)
    =============================== */
    const { data: partner, error } = await supabase
      .from("partners")
      .insert({
        ...body,
        onboarding_email_sent: false,
      })
      .select()
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { error: error?.message || "Partner insert failed" },
        { status: 400 }
      );
    }

    /* ===============================
       3️⃣ MANUAL MODE → STOP
    =============================== */
    if (approvalMode === "manual") {
      return NextResponse.json({
        success: true,
        mode: "manual",
        status: "waiting_for_approval",
      });
    }

    /* ===============================
       4️⃣ AUTOMATIC MODE
       USE EXISTING ACTIONS ROUTE
    =============================== */

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host")
        ? `https://${req.headers.get("host")}`
        : "");

    if (!origin) {
      return NextResponse.json(
        { error: "Unable to determine request origin" },
        { status: 500 }
      );
    }

    const actionsUrl = `${origin}/api/partners/actions`;

    /* ---- Shopify Sync (working code path) ---- */
    const syncRes = await fetch(actionsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_shopify_tags",
        partner_id: partner.partner_id,
        email_address: partner.email_address,
      }),
    });

    if (!syncRes.ok) {
      const err = await syncRes.text();
      console.error("Auto Shopify sync failed:", err);
      return NextResponse.json(
        { error: "Auto Shopify sync failed" },
        { status: 500 }
      );
    }

    /* ---- Send Email (SMTP — proven working) ---- */
    const emailRes = await fetch(actionsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_email_sent",
        partner_id: partner.partner_id,
        email_address: partner.email_address,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Auto email failed:", err);
      return NextResponse.json(
        { error: "Auto email failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "automatic",
      status: "email_sent_and_synced",
    });
  } catch (err: any) {
    console.error("ONBOARD ROUTE ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
