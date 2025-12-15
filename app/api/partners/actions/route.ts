import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Generate Doorplace USA Partner ID
 */
function generatePartnerID() {
  return "DP" + Math.floor(1000000 + Math.random() * 9000000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, partner_id } = body as {
      action?: "regenerate_partner_id" | "mark_email_sent" | "delete_partner";
      partner_id?: string;
    };

    if (!action || !partner_id) {
      return NextResponse.json(
        { error: "action and partner_id required" },
        { status: 400 }
      );
    }

    /* ===============================
       REGENERATE PARTNER ID
    =============================== */
    if (action === "regenerate_partner_id") {
      const newPartnerID = generatePartnerID();
      const newTrackingLink = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${newPartnerID}`;

      const { error } = await supabaseAdmin
        .from("partners")
        .update({
          partner_id: newPartnerID,
          tracking_link: newTrackingLink,
          onboarding_email_sent: false,
        })
        .eq("partner_id", partner_id);

      if (error) throw error;

      return NextResponse.json({
        status: "partner_id_regenerated",
        partner_id: newPartnerID,
        tracking_link: newTrackingLink,
      });
    }

    /* ===============================
       SEND ONBOARDING EMAIL (GMAIL via APPS SCRIPT)
    =============================== */
    if (action === "mark_email_sent") {
      // Pull the partner’s actual email + tracking link from Supabase
      const { data: partner, error } = await supabaseAdmin
        .from("partners")
        .select("email_address, partner_id, tracking_link")
        .eq("partner_id", partner_id)
        .single();

      if (error || !partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }

      const GAS_WEBHOOK_URL = process.env.APPS_SCRIPT_WEBHOOK;
      if (!GAS_WEBHOOK_URL) {
        return NextResponse.json(
          { error: "Missing APPS_SCRIPT_WEBHOOK in env" },
          { status: 500 }
        );
      }

      // IMPORTANT: This matches your GAS handler:
      // switch(body.type) { case "send_partner_onboarding_email": sendOnboardingEmail(body.data...) }
      const payload = {
        type: "send_partner_onboarding_email",
        data: {
          email: partner.email_address,
          partnerID: partner.partner_id,
          trackingLink: partner.tracking_link,
        },
      };

      const gasRes = await fetch(GAS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const gasText = await gasRes.text();

      if (!gasRes.ok) {
        console.error("GAS EMAIL FAILED:", gasRes.status, gasText);
        return NextResponse.json(
          { error: "Google Apps Script email failed", details: gasText },
          { status: 500 }
        );
      }

      // Mark email as sent in Supabase
      const { error: updateErr } = await supabaseAdmin
        .from("partners")
        .update({ onboarding_email_sent: true })
        .eq("partner_id", partner_id);

      if (updateErr) throw updateErr;

      return NextResponse.json({ status: "email_sent", gas_response: gasText });
    }

    /* ===============================
       DELETE PARTNER
    =============================== */
    if (action === "delete_partner") {
      const { error } = await supabaseAdmin.from("partners").delete().eq("partner_id", partner_id);
      if (error) throw error;

      return NextResponse.json({ status: "partner_deleted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("PARTNER ACTION ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
