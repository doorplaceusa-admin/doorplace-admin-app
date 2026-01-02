import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/mailer";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { auth_user_id, email_address } = await req.json();

    if (!auth_user_id || !email_address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Find partner
    const { data: partner } = await supabaseAdmin
      .from("partners")
      .select("id, auth_user_id, email_verified")
      .eq("email_address", email_address)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json(
        { error: "Partner record not found" },
        { status: 404 }
      );
    }

    // 2. Always generate a fresh token
    const email_verify_token = crypto.randomUUID();

    // 3. Link auth user if not linked yet
    if (!partner.auth_user_id) {
      await supabaseAdmin
        .from("partners")
        .update({
          auth_user_id,
          email_verify_token,
          email_verify_sent_at: new Date().toISOString(),
        })
        .eq("id", partner.id);

      // Create profile row (safe insert)
      await supabaseAdmin
        .from("profiles")
        .insert({
          id: auth_user_id,
          role: "partner",
          email: email_address,
        });
    } else {
      // Already linked → just refresh token + resend email
      await supabaseAdmin
        .from("partners")
        .update({
          email_verify_token,
          email_verify_sent_at: new Date().toISOString(),
        })
        .eq("id", partner.id);
    }

    // 4. SEND VERIFICATION EMAIL (ALWAYS)
    await sendEmail({
      to: email_address,
      subject: "Confirm your TradePilot account",
      html: `
<p>Your TradePilot account is almost ready.</p>

<p>Please confirm your email address to continue:</p>

<p>
  <a
    href="https://tradepilot.doorplaceusa.com/api/partners/verify-email?token=${email_verify_token}"
    style="display:inline-block;padding:12px 20px;background:#b80d0d;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;"
  >
    Confirm Email
  </a>
</p>

<p style="font-size:12px;color:#777;margin-top:24px;">
  TradePilot • Built by Doorplace USA
</p>
`,
    });

    return NextResponse.json({
      success: true,
      email_sent: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
