import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      name,
      phone,
      email,
      business,
      website,
      address,
      city,
      state,
      zip,
      coverage,
      experience,
      services,
      other_services,
      signature,
      agreement,
    } = body;

    // Normalize services (IMPORTANT FIX)
    if (!services) {
      services = [];
    } else if (!Array.isArray(services)) {
      services = [services];
    }

    // Force agreement to boolean
    const agreed = agreement === true || agreement === "on" || agreement === "true";

    // Validation
    if (!name || !phone || !email || !address || !city || !state || !zip || !signature || !agreed) {
      return NextResponse.json(
        { error: "Missing required fields or agreement not accepted" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("contractors")
      .insert([
        {
          name,
          phone,
          email,
          business_name: business || null,
          website: website || null,
          address,
          city,
          state,
          zip,
          coverage_area: coverage || null,
          experience: experience || null,
          services,
          other_services: other_services || null,
          signature,
          agreed,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contractor: data[0],
    });

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}