import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/mailer";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Generate Doorplace USA Partner ID
 * Matches onboarding logic exactly
 * Format: DP####### (7 digits, no dash)
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

    // CHECK IF EMAIL ALREADY EXISTS
    const { data: existing } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("email_address", email_address)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // GENERATE UNIQUE PARTNER ID
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

    // GENERATE EMAIL VERIFICATION TOKEN
    const email_verify_token = crypto.randomUUID();

    // INSERT PARTNER
    const { data: partner, error } = await supabaseAdmin
      .from("partners")
      .insert({
        auth_user_id,
        partner_id,
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

    // SEND VERIFICATION EMAIL
    await sendEmail({
      to: email_address,
      subject: "Confirm your Doorplace USA partner account (TradePilot)",
      html: `
  <p>Your Doorplace USA partner account has been created.</p>

<p>
  <strong>TradePilot</strong> is the partner portal used by Doorplace USA.
</p>

<p>
  This will be your home base as a partner — the place where you’ll log in to:
</p>

<ul>
  <li>Complete onboarding</li>
  <li>Submit and track orders</li>
  <li>View commissions and payouts</li>
  <li>Access partner resources and updates</li>
</ul>

<p>
  Please confirm your email address to activate your account and continue:
</p>

<p>
  <a
    href="https://tradepilot.doorplaceusa.com/api/partners/verify-email?token=${email_verify_token}"
    style="display:inline-block;padding:12px 20px;background:#b80d0d;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;"
  >
    Confirm Email
  </a>
</p>

<p style="margin-top:24px;font-size:13px;color:#555;">
  If you did not request this account, you can safely ignore this email.
</p>

<p style="font-size:12px;color:#777;margin-top:30px;">
  TradePilot • Built by Doorplace USA
</p>

`,

    });

    return NextResponse.json({
      success: true,
      partner_id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
