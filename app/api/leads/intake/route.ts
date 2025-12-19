import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lead_id = `LD-${Date.now()}`;

    const {
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
      signature
    } = body;

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
        lead_status: "new",
        source: "website"
      }
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead_id });

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
