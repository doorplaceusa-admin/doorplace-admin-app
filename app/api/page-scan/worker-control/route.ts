import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { enabled } = await req.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be boolean" },
        { status: 400 }
      );
    }

    // single-row control table
    await supabaseAdmin
      .from("page_scan_control")
      .upsert(
        {
          id: 1,
          scanning_enabled: enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    return NextResponse.json({
      success: true,
      scanning_enabled: enabled,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "worker control failed" },
      { status: 500 }
    );
  }
}
