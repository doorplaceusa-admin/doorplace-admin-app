// app/api/leads/intake/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/*
  PURPOSE (LOCK AFTER THIS):
  - Accept public contact / quote submissions
  - Capture partner_id
  - Upload photos to Supabase Storage
  - Insert lead into `leads` table
  - Create in-app admin alert (NO EMAILS)
  - Redirect customer to Thank You page
*/

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lead_id = `LD-${Date.now()}`;

    /* ===============================
       1. CAPTURE PARTNER ID
    =============================== */
    let partner_id = formData.get("partner_id") as string | null;

    if (!partner_id) {
      const referer = req.headers.get("referer") || "";
      const match = referer.match(/partner_id=([A-Za-z0-9-_]+)/);
      if (match) partner_id = match[1];
    }

    /* ===============================
       2. HANDLE PHOTO UPLOADS
    =============================== */
    const photos: string[] = [];
    const uploadedFiles = formData.getAll("photos[]") as File[];

    for (const file of uploadedFiles) {
      if (!file || file.size === 0) continue;

      const fileExt = file.name.split(".").pop();
      const filePath = `leads/${lead_id}/${crypto.randomUUID()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("lead-photos")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (!error) {
        const { data } = supabase.storage
          .from("lead-photos")
          .getPublicUrl(filePath);

        if (data?.publicUrl) photos.push(data.publicUrl);
      }
    }

    /* ===============================
       3. INSERT LEAD
    =============================== */
    const { error: leadError } = await supabase.from("leads").insert([
      {
        lead_id,
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        customer_email: formData.get("email"),
        customer_phone: formData.get("phone"),
        street_address: formData.get("street_address"),
        city: formData.get("city"),
        state: formData.get("state"),
        zip_code: formData.get("zip_code"),
        business_name: formData.get("business_name"),
        spoken_with_rep: formData.get("spoken_with_rep"),
        project_type: formData.get("project_type"),
        size_needed: formData.get("size_needed"),
        installation_needed: formData.get("installation_needed"),
        project_details: formData.get("project_details"),
        start_timeframe: formData.get("start_timeframe"),
        lead_source: formData.get("lead_source"),
        signature: formData.get("signature"),
        lead_status: "new",
        source: partner_id ? "partner" : "website",
        partner_id,
        photos,
      },
    ]);

    if (leadError) {
      console.error("Lead insert error:", leadError);
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    /* ===============================
       4. ADMIN ALERT (IN-APP ONLY)
    =============================== */
    await supabase.from("admin_alerts").insert([
      {
        type: "new_lead",
        reference_id: lead_id,
        title: "New Lead Submitted",
        message: `New lead from ${formData.get("first_name")} ${formData.get("last_name")}`,
        read: false,
      },
    ]);

    /* ===============================
       5. REDIRECT CUSTOMER
    =============================== */
    return NextResponse.redirect(
      "https://doorplaceusa.com/pages/thank-you",
      { status: 303 }
    );
  } catch (err) {
    console.error("Lead intake crash:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
