import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const lead_id = `LD-${Date.now()}`;

    const data = {
      lead_id,
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      customer_email: formData.get("email"), // ✅ FIXED
      customer_phone: formData.get("phone"), // ✅ FIXED
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
    };

    const { error } = await supabase.from("leads").insert([data]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead_id });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
