import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    // Check if already running
    const { data: existing } = await supabaseAdmin
      .from("sitemap_rebuild_status")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (existing?.status === "running") {
      return NextResponse.json(
        { success: false, error: "Rebuild already running" },
        { status: 400 }
      );
    }

    // Set status to running
    await supabaseAdmin
      .from("sitemap_rebuild_status")
      .upsert({
        id: 1,
        status: "running",
        rows_processed: 0,
        updated_at: new Date().toISOString(),
      });

    // Fire worker (non-blocking)
    fetch("https://tradepilot.doorplaceusa.com/api/rebuild-sitemap", {
      method: "GET",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}