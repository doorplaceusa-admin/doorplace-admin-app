// app/api/leads/intake/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAdminNotification } from "@/lib/sendAdminNotification";





export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lead_id = `LD-${Date.now()}`;

    /* ===============================
   1. HANDLE PHOTOS (FIXED)
================================ */
const files = formData.getAll("photos[]") as File[];
const photoUrls: string[] = [];

for (const file of files) {
  if (!(file instanceof File) || file.size === 0) continue;

  const fileExt = file.name.split(".").pop();
  const safeName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  // ✅ single bucket: photos / leads / lead_id
  const filePath = `leads/${lead_id}/${safeName}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("photos") // ✅ correct bucket
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Photo upload failed:", uploadError);
    continue;
  }

  // ✅ get public URL from SAME bucket
  const { data } = supabase.storage
    .from("photos")
    .getPublicUrl(filePath);

  if (data?.publicUrl) {
    photoUrls.push(data.publicUrl);
  }
}



    /* ===============================
       2. NORMALIZE CORE CONTACT INFO
    =============================== */
    let submissionType = formData.get("submission_type");

// ✅ PARTNER ID (single source of truth)
const partnerId = formData.get("partner_id") as string | null;

// 🔒 SAFETY NET — auto-detect partner tracking leads
if (partnerId && submissionType === "general_inquiry") {
  submissionType = "partner_tracking";
}


    const shopify_account_email = formData.get("shopify_account_email") as string | null;


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
   PARTNER NAME RESOLUTION (STEP 1)
=============================== */


let partnerName: string | null = null;


if (partnerId) {
  const { data: partner } = await supabase
    .from("partners")
    .select("first_name, last_name")
    .eq("partner_id", partnerId)
    .single();

  if (partner) {
    partnerName = `${partner.first_name ?? ""} ${partner.last_name ?? ""}`.trim();
  }
}


    /* ===============================
       3. INSERT LEAD (FULLY ALIGNED)
    =============================== */
    // INSERT LEAD
const { data: leadData, error: leadError } = await supabase
  .from("leads")
  .insert([
    {
      lead_id,
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
  return new NextResponse("Internal Server Error", { status: 500 });
}

// ADMIN EMAIL ALERT
await sendAdminNotification({
  type: "lead",
  title: "New Lead Submitted",
  details: {
    lead_id: leadData.lead_id,
    name: `${leadData.first_name ?? ""} ${leadData.last_name ?? ""}`,
    email: leadData.email,
    phone: leadData.phone,
    city: leadData.city,
    state: leadData.state,
  },
});



/* ===============================
   4. CREATE ORDER IF PARTNER ORDER
=============================== */
if (submissionType === "partner_order") {
  const processUrl = new URL("/api/orders/process", req.url);

  const res = await fetch(processUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_id }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Order process failed:", res.status, errorText);
  } else {
    console.log("✅ Order process succeeded");
  }
}



    /* ===============================
       4. ADMIN ALERT
    =============================== */
    await supabase.from("admin_alerts").insert([
      {
        type: "new_lead",
        reference_id: lead_id,
        title: "New Lead Submitted",
        message: `New lead from ${firstName ?? ""} ${lastName ?? ""}`,
        read: false,
      },
    ]);

   /* ===============================
   5. THANK-YOU RESPONSE (FINAL)
=============================== */

/* ===============================
   FINAL RESPONSE (NO REDIRECTS)
=============================== */
return NextResponse.redirect(
  "https://doorplaceusa.com/pages/thank-you",
  { status: 302 }
);


  } catch (err) {
    console.error("Lead intake crash:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
