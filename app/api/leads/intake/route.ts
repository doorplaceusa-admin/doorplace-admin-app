import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    // ✅ Handle multipart/form-data (NOT JSON)
    const formData = await req.formData();

    const lead_id = `LD-${Date.now()}`;

    const first_name = formData.get("first_name");
    const last_name = formData.get("last_name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const street_address = formData.get("street_address");
    const city = formData.get("city");
    const state = formData.get("state");
    const zip_code = formData.get("zip_code");
    const business_name = formData.get("business_name");
    const spoken_with_rep = formData.get("spoken_with_rep");
    const project_type = formData.get("project_type");
    const size_needed = formData.get("size_needed");
    const installation_needed = formData.get("installation_needed");
    const project_details = formData.get("project_details");
    const start_timeframe = formData.get("start_timeframe");
    const lead_source = formData.get("lead_source");
    const signature = formData.get("signature");

    const { error } = await supabase.from("leads").insert([
      {
        lead_id,
        first_name,
        last_name,
        email,
        phone,
        street_address,
        city,
        state,
        zip_code,
        business_name,
        spoken_with_rep,
        project_type,
        size_needed,
        installation_needed,
        project_details,
        start_timeframe,
        lead_source,
        signature,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead_id });
  } catch (err) {
    console.error("API crash:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
