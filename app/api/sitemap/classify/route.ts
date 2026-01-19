import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const startedAt = Date.now();

  try {
    // Run classification function
    const { error } = await supabaseAdmin.rpc("classify_sitemap_urls");

    if (error) {
      throw error;
    }

    const finishedAt = Date.now();
    const durationMs = finishedAt - startedAt;

    return NextResponse.json({
      success: true,
      status: "done",
      message: "Classification completed successfully.",
      duration_ms: durationMs,
    });

  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: err.message || "Classification failed",
      },
      { status: 500 }
    );
  }
}
