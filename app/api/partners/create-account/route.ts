import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/mailer";
import crypto from "crypto";

export const runtime = "nodejs";

/* ============================================================
   DOORPLACE USA COMPANY ID (Multi-Tenant Anchor)
============================================================ */
const DOORPLACE_COMPANY_ID = "88c22910-7bd1-42fc-bc81-8144a50d7b41";

/**
 * Generate Doorplace USA Partner ID
 * Format: DP####### (7 digits)
 */
function generatePartnerID() {
  return "DP" + Math.floor(1000000 + Math.random() * 9000000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      auth_user_id,
      email_address,
      first_name,
      last_name,
      cell_phone_number,
      business_name,
      coverage_area,
      street_address,
      city,
      state,
      zip_code,
      preferred_contact_method,
      sales_experience,
      digital_signature,
    } = body;

    if (!auth_user_id || !email_address) {
      return NextResponse.json(
        { error: "Auth user ID and email are required" },
        { status: 400 }
      );
    }

    /* ============================================================
       CHECK IF PARTNER ALREADY EXISTS
    ============================================================ */
    const { data: existingPartner } = await supabaseAdmin
      .from("partners")
      .select("id, auth_user_id")
      .eq("email_address", email_address)
      .maybeSingle();

    // CASE 1 — Exists but not linked → Link account
    if (existingPartner && !existingPartner.auth_user_id) {
      const email_verify_token = crypto.randomUUID();

      await supabaseAdmin
        .from("partners")
        .update({
          auth_user_id,
          email_verify_token,
          email_verify_sent_at: new Date().toISOString(),
        })
        .eq("id", existingPartner.id);

      await sendEmail({
        to: email_address,
        subject: "Confirm your Doorplace USA partner account (TradePilot)",
        html: `
<p>Your TradePilot login has been linked to your existing Doorplace USA partner profile.</p>

<p>Please confirm your email to activate access:</p>

<p>
  <a
    href="https://tradepilot.doorplaceusa.com/api/partners/verify-email?token=${email_verify_token}"
    style="display:inline-block;padding:12px 20px;background:#b80d0d;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;"
  >
    Confirm Email
  </a>
</p>
`,
      });

      return NextResponse.json({
        success: true,
        linked_existing_partner: true,
      });
    }

    // CASE 2 — Already linked
    if (existingPartner?.auth_user_id) {
      return NextResponse.json(
        { error: "Account already exists. Please log in." },
        { status: 409 }
      );
    }

    /* ============================================================
       GENERATE UNIQUE PARTNER ID
    ============================================================ */
    let partner_id: string | null = null;

    for (let i = 0; i < 5; i++) {
      const candidate = generatePartnerID();

      const { data: clash } = await supabaseAdmin
        .from("partners")
        .select("id")
        .eq("partner_id", candidate)
        .maybeSingle();

      if (!clash) {
        partner_id = candidate;
        break;
      }
    }

    if (!partner_id) {
      return NextResponse.json(
        { error: "Failed to generate unique partner ID" },
        { status: 500 }
      );
    }

    /* ============================================================
       BUILD TRACKING LINK + VERIFY TOKEN
    ============================================================ */
    const tracking_link = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partner_id}`;
    const email_verify_token = crypto.randomUUID();

    /* ============================================================
       CREATE PARTNER (WITH COMPANY_ID FIX)
    ============================================================ */
    const { data: partner, error } = await supabaseAdmin
      .from("partners")
      .insert({
        company_id: DOORPLACE_COMPANY_ID, // 🔥 FIXED

        auth_user_id,
        partner_id,
        tracking_link,

        first_name,
        last_name,
        email_address,
        cell_phone_number,
        business_name,
        coverage_area,
        street_address,
        city,
        state,
        zip_code,
        preferred_contact_method,
        sales_experience,
        digital_signature,

        status: "pending",
        approved_at: null,

        email_verified: false,
        email_verify_token,
        email_verify_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { error: error?.message || "Partner creation failed" },
        { status: 500 }
      );
    }

    /* ============================================================
       SEND VERIFICATION EMAIL
    ============================================================ */
    await sendEmail({
      to: email_address,
      subject: "Confirm your Doorplace USA partner account (TradePilot)",
      html: `
<p>Your Doorplace USA partner account has been created.</p>

<p><strong>TradePilot</strong> is the partner portal used by Doorplace USA.</p>

<p>Please confirm your email address to activate your account:</p>

<p>
  <a
    href="https://tradepilot.doorplaceusa.com/api/partners/verify-email?token=${email_verify_token}"
    style="display:inline-block;padding:12px 20px;background:#b80d0d;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;"
  >
    Confirm Email
  </a>
</p>

<p style="font-size:12px;color:#777;margin-top:30px;">
  TradePilot • Built by Doorplace USA
</p>
`,
    });

    return NextResponse.json({
      success: true,
      partner_id,
      tracking_link,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
