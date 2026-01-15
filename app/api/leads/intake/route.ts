// app/api/leads/intake/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAdminNotification } from "@/lib/sendAdminNotification";
import nodemailer from "nodemailer";
import { notifyAdmin } from "@/lib/notifyAdmin";

/* =========================================================
   LEAD INTAKE — PRESERVED + STABILIZED (NO DROPS)
========================================================= */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lead_id = `LD-${Date.now()}`;

    /* ===============================
       1. HANDLE PHOTOS (FIXED / STABLE)
    ================================ */
    const files = formData.getAll("photos[]") as File[];
    const photoUrls: string[] = [];

    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;

      const fileExt = file.name.split(".").pop();
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const filePath = `leads/${lead_id}/${safeName}`;

      // ✅ Node-safe buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from("photos")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Photo upload failed:", uploadError);
        continue;
      }

      const { data } = supabaseAdmin.storage
        .from("photos")
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        photoUrls.push(data.publicUrl);
      }
    }

    /* ===============================
       2. NORMALIZE CORE CONTACT INFO
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
       PARTNER NAME RESOLUTION
    ================================ */
    let partnerName: string | null = null;
    let companyId: string | null = null;

    if (partnerId) {
      const { data: partner, error } = await supabaseAdmin
        .from("partners")
        .select("first_name, last_name, company_id")
        .eq("partner_id", partnerId)
        .single();

      if (!error && partner) {
        partnerName = `${partner.first_name ?? ""} ${partner.last_name ?? ""}`.trim();
        companyId = partner.company_id;
      }
    }

    /* ===============================
       3. INSERT LEAD (FULLY ALIGNED)
    ================================ */
    const { data: leadData, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert([
        {
          lead_id,
          company_id: companyId ?? "88c22910-7bd1-42fc-bc81-8144a50d7b41",
          partner_id: partnerId,
          partner_name: partnerName,

          submission_type: submissionType,
          quote_type: formData.get("quote_type"),
          is_partner_order: formData.get("is_partner_order") === "true",
          shopify_account_email,

          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          street_address: streetAddress,
          city,
          state,
          zip,

          project_details: formData.get("project_details"),

          swing_size: formData.get("swing_size"),
          porch_ceiling_height: formData.get("porch_ceiling_height"),
          installation_needed: formData.get("installation_needed"),
          hanging_method: formData.get("hanging_method"),

          door_width: formData.get("door_width"),
          door_height: formData.get("door_height"),
          number_of_doors: formData.get("number_of_doors"),
          door_type: formData.get("door_type"),
          door_type_other: formData.get("door_type_other"),
          door_material: formData.get("door_material"),
          door_material_other: formData.get("door_material_other"),
          finish_preference: formData.get("finish_preference"),
          door_installation_needed: formData.get("door_installation_needed"),
          installation_location: formData.get("installation_location"),

          wood_type: formData.get("wood_type"),
          finish: formData.get("finish"),
          swing_price: formData.get("swing_price")
            ? Number(formData.get("swing_price"))
            : null,
          accessory_price: formData.get("accessory_price")
            ? Number(formData.get("accessory_price"))
            : null,
          installation_fee: formData.get("installation_fee")
            ? Number(formData.get("installation_fee"))
            : null,
          shipping_fee: formData.get("shipping_fee")
            ? Number(formData.get("shipping_fee"))
            : null,

          signature: formData.get("signature"),
          photos: photoUrls,
          lead_status: "new",
          source: "website",
        },
      ])
      .select()
      .single();

    if (leadError || !leadData) {
      console.error("Lead insert error:", leadError);
      return NextResponse.json({ error: "Lead insert failed" }, { status: 500 });
    }

    /* ===============================
       ADMIN IN-APP NOTIFICATION
    ================================ */
    await notifyAdmin({
      type: "lead_created",
      title: "New Lead / Order Received",
      body: "A new entry was added to the leads table",
      entityType: "lead",
      entityId: leadData.id,
      companyId: leadData.company_id,
    });

    /* ===============================
       ADMIN EMAIL ALERT
    ================================ */
    await sendAdminNotification({
      type: "lead",
      title: "New Lead Submitted",
      details: {
        lead_id: leadData.lead_id,
        name: `${leadData.first_name ?? ""} ${leadData.last_name ?? ""}`,
        email: `${leadData.email}`,
        phone: `${leadData.phone}`,
        city: `${leadData.city}`,
        state: `${leadData.state}`,
      },
    });

    /* ===============================
       4. CREATE ORDER IF PARTNER ORDER
    ================================ */
    if (submissionType === "partner_order") {
      const processUrl = new URL("/api/orders/process", req.url);

      const res = await fetch(processUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Order process failed:", res.status, errorText);
      }
    }

    /* ===============================
       FINAL RESPONSE (NO REDIRECTS)
    ================================ */
    return NextResponse.json({
      success: true,
      lead_id: leadData.lead_id,
    });
  } catch (err) {
    console.error("Lead intake crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
