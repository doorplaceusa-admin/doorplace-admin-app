import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

/* ============================
   SETUP
============================ */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate Doorplace USA Partner ID
 * Example: DP1234567
 */
function generatePartnerID() {
  return "DP" + Math.floor(1000000 + Math.random() * 9000000);
}

/* ============================
   POST HANDLER
============================ */
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    /* ============================
       NORMALIZE INPUT
    ============================ */
    const normalized = {
      email_address: payload.email_address?.toLowerCase().trim(),
      first_name: payload.first_name,
      last_name: payload.last_name,
      cell_phone_number: payload.cell_phone_number,
      street_address: payload.street_address,
      city: payload.city,
      state: payload.state,
      zip_code: payload.zip_code,
      business_name: payload.business_name,
      coverage_area: payload.coverage_area,
      preferred_contact_method: payload.preferred_contact_method,
      sales_experience: payload.sales_experience,
      digital_signature: payload.digital_signature,
      confirmation: payload.confirmation,
    };

    if (!normalized.email_address) {
      return NextResponse.json(
        { error: "email_address required" },
        { status: 400 }
      );
    }

    /* ============================
       LOOKUP EXISTING PARTNER
    ============================ */
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("partners")
      .select("id, partner_id")
      .eq("email_address", normalized.email_address)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let partner_id = existing?.partner_id;
    let partner_row_id = existing?.id ?? null;
    let actionType: "created" | "updated" = "updated";

    /* ============================
       UPDATE EXISTING PARTNER
    ============================ */
    if (existing) {
      const { error } = await supabaseAdmin
        .from("partners")
        .update({
          ...normalized,
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      /* ============================
         CREATE NEW PARTNER
      ============================ */
      partner_id = generatePartnerID();
      actionType = "created";

      const tracking_link = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partner_id}`;

      const { data: inserted, error } = await supabaseAdmin
        .from("partners")
        .insert({
          ...normalized,
          partner_id,
          tracking_link,
          onboarding_email_sent: false,
          status: "active",
        })
        .select("id")
        .single();

      if (error) throw error;

      partner_row_id = inserted.id;
    }

    /* ============================
       ADMIN EMAIL NOTIFICATION
       (FAIL-SAFE — NEVER BLOCKS)
    ============================ */
    if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFICATION_EMAIL) {
      try {
        await resend.emails.send({
          from: "Doorplace USA <no-reply@doorplaceusa.com>",
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject:
            actionType === "created"
              ? "New Partner Onboarding Submitted"
              : "Partner Onboarding Updated",
          html: `
            <h2>${actionType === "created" ? "New" : "Updated"} Partner Onboarding</h2>
            <p><strong>Name:</strong> ${normalized.first_name} ${normalized.last_name}</p>
            <p><strong>Email:</strong> ${normalized.email_address}</p>
            <p><strong>Partner ID:</strong> ${partner_id}</p>
            <p>
              <a href="https://doorplaceusa.com/account" target="_blank">
                Open TradePilot Dashboard
              </a>
            </p>
          `,
        });
      } catch (emailErr) {
        console.error("ADMIN EMAIL FAILED:", emailErr);
      }
    } else {
      console.warn("⚠️ Admin email ENV vars missing — email skipped");
    }

    /* ============================
       TRADEPILOT NOTIFICATION
    ============================ */
    await supabaseAdmin.from("notifications").insert({
      type: "partner_onboarding",
      title:
        actionType === "created"
          ? "New Partner Onboarded"
          : "Partner Onboarding Updated",
      message: `${normalized.first_name} ${normalized.last_name} submitted onboarding`,
      entity_id: partner_row_id,
      partner_id,
      read: false,
    });

    /* ============================
       RESPONSE
    ============================ */
    return NextResponse.json({
      status: actionType,
      partner_id,
    });
  } catch (err) {
    console.error("PARTNER INTAKE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
