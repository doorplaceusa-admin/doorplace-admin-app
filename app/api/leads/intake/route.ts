// app/api/leads/intake/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lead_id = `LD-${Date.now()}`;

    // Minimal insert
    const { error } = await supabaseAdmin.from("leads").insert({
      lead_id,
      source: "website",
      lead_status: "new",
    });

    if (error) {
      console.error("Insert failed:", error);
      return new NextResponse("Insert failed", { status: 500 });
    }

    // ✅ REDIRECT BLOCK (NEW)
    return NextResponse.redirect(
      "https://doorplaceusa.com/pages/thank-you",
      { status: 302 }
    );

  } catch (err) {
    console.error("Lead intake crash:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
