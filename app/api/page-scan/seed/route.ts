import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const { error } = await supabaseAdmin.rpc("seed_page_scan_jobs");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Page scan jobs seeded" });
}
