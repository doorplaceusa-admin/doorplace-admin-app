import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;

export async function POST(req: Request) {
  if (!SYNC_SECRET) {
    return NextResponse.json(
      { success: false, error: "Missing SITEMAP_SYNC_SECRET" },
      { status: 500 }
    );
  }

  const headerSecret = req.headers.get("x-sync-secret");
  if (headerSecret !== SYNC_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { error } = await supabaseAdmin
    .from("sitemap_sync_jobs")
    .update({
      status: "running",
      updated_at: new Date().toISOString(),
      finished_at: null,
    })
    .in("status", ["canceled", "failed"]);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    status: "running",
  });
}