import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const { data: existing } = await supabaseAdmin
      .from("sitemap_rebuild_status")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (existing?.status === "running") {
      return NextResponse.json(
        { success: false, error: "Rebuild already running" },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("sitemap_rebuild_status")
      .upsert({
        id: 1,
        status: "running",
        rows_processed: 0,
        updated_at: new Date().toISOString(),
      });

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://tradepilot.doorplaceusa.com";

    fetch(`${origin}/api/rebuild-sitemap`, {
      method: "GET",
    }).catch((err) => {
      console.error("Failed to trigger rebuild worker:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}