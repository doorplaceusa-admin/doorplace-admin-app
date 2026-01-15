// app/api/leads/intake/route.ts
// BARE-MINIMUM LEAD INTAKE — ISOLATION BUILD

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    // 1. Parse form
    const formData = await req.formData();

    // 2. Generate lead_id
    const lead_id = `LD-${Date.now()}`;

    // 3. Minimal required fields only
    const first_name = formData.get("first_name") || null;
    const last_name = formData.get("last_name") || null;
    const email = formData.get("email") || null;
    const phone = formData.get("phone") || null;

    // 4. Insert ONLY into leads table
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert([
        {
          lead_id,
          first_name,
          last_name,
          email,
          phone,
          lead_status: "new",
          source: "website",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("INSERT ERROR:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // 5. Return success
    return NextResponse.json({
      ok: true,
      lead_id: data.lead_id,
    });
  } catch (err: any) {
    console.error("INTAKE CRASH:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
