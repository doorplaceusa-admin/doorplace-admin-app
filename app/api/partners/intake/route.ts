import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Generate Doorplace USA Partner ID
 * Example: DP1234567
 */
function generatePartnerID() {
  return "DP" + Math.floor(1000000 + Math.random() * 9000000);
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Normalize incoming payload
    const normalized = {
      email_address: payload.email_address ?? payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      cell_phone_number: payload.cell_phone_number ?? payload.phone,
      street_address: payload.street_address,
      city: payload.city,
      state: payload.state,
      zip_code: payload.zip_code ?? payload.zip,
      business_name: payload.business_name,
      coverage_area: payload.coverage_area,
      preferred_contact_method: payload.preferred_contact_method,
      sales_experience: payload.sales_experience,
      digital_signature: payload.digital_signature,
      confirmation: payload.confirmation,
    };

    const email = normalized.email_address?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json(
        { error: "email_address required" },
        { status: 400 }
      );
    }

    // Check for existing partner
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("partners")
      .select("partner_id")
      .eq("email_address", email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    // Update existing partner (NO ID changes)
    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("partners")
        .update({
          first_name: normalized.first_name,
          last_name: normalized.last_name,
          cell_phone_number: normalized.cell_phone_number,
          street_address: normalized.street_address,
          city: normalized.city,
          state: normalized.state,
          zip_code: normalized.zip_code,
          business_name: normalized.business_name,
          coverage_area: normalized.coverage_area,
          preferred_contact_method: normalized.preferred_contact_method,
          sales_experience: normalized.sales_experience,
          digital_signature: normalized.digital_signature,
          confirmation: normalized.confirmation,
        })
        .eq("email_address", email);

      if (updateError) throw updateError;

      return NextResponse.json({
        status: "updated",
        partner_id: existing.partner_id,
      });
    }

    // Create new partner
    const partner_id = generatePartnerID();
    const tracking_link = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partner_id}`;

    const { data: created, error: insertError } = await supabaseAdmin
      .from("partners")
      .insert({
        email_address: email,
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        cell_phone_number: normalized.cell_phone_number,
        street_address: normalized.street_address,
        city: normalized.city,
        state: normalized.state,
        zip_code: normalized.zip_code,
        business_name: normalized.business_name,
        coverage_area: normalized.coverage_area,
        preferred_contact_method: normalized.preferred_contact_method,
        sales_experience: normalized.sales_experience,
        digital_signature: normalized.digital_signature,
        confirmation: normalized.confirmation,
        partner_id,
        tracking_link,
        onboarding_email_sent: false,
        status: "active",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      status: "created",
      partner_id: created.partner_id,
      email: created.email_address,
    });

  } catch (err) {
    console.error("PARTNER INTAKE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
