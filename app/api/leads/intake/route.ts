// app/api/leads/intake/route.ts
// STEP 1: BARE MINIMUM + CORE NORMALIZATION (NO PHOTOS, NO NOTIFY, NO EMAIL, NO ORDERS)

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lead_id = `LD-${Date.now()}`;

    /* ===============================
       NORMALIZE CORE CONTACT INFO
    ================================ */
    let submissionType = formData.get("submission_type");

    const url = new URL(req.url);
    const partnerId =
      (formData.get("partner_id") as string | null) ||
      url.searchParams.get("partner_id");

    if (partnerId && submissionType === "general_inquiry") {
      submissionType = "partner_tracking";
    }

    const shopify_account_email =
      formData.get("shopify_account_email") as string | null;

    const firstName =
      formData.get("partner_customer_first_name") ||
      formData.get("customer_first_name") ||
      formData.get("first_name") ||
      null;

    const lastName =
      formData.get("partner_customer_last_name") ||
      formData.get("customer_last_name") ||
      formData.get("last_name") ||
      null;

    const email =
      formData.get("partner_customer_email") ||
      formData.get("customer_email") ||
      formData.get("email") ||
      null;

    const phone =
      formData.get("partner_customer_phone") ||
      formData.get("customer_phone") ||
      formData.get("phone") ||
      null;

    const streetAddress =
      formData.get("partner_customer_street_address") ||
      formData.get("customer_street_address") ||
      formData.get("street_address") ||
      null;

    const city =
      formData.get("partner_customer_city") ||
      formData.get("customer_city") ||
      formData.get("city") ||
      null;

    const state =
      formData.get("partner_customer_state") ||
      formData.get("customer_state") ||
      formData.get("state") ||
      null;

    const zip =
      formData.get("partner_customer_zip") ||
      formData.get("customer_zip") ||
      formData.get("zip") ||
      null;

    /* ===============================
       INSERT LEAD (CORE ONLY)
    ================================ */
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert([
        {
          lead_id,
          submission_type: submissionType,
          partner_id: partnerId,
          shopify_account_email,

          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          street_address: streetAddress,
          city,
          state,
          zip,

          lead_status: "new",
          source: "website",
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error("INSERT ERROR:", error);
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Insert failed" },
        { status: 500 }
      );
    }

    /* ===============================
       SUCCESS RESPONSE
    ================================ */
    return NextResponse.json({
      ok: true,
      lead_id: data.lead_id,
    });
  } catch (err: any) {
    console.error("INTAKE CRASH:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
