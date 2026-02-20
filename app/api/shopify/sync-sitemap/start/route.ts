import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;

export async function POST(req: Request) {
  if (!SYNC_SECRET) {
    return NextResponse.json(
      { success: false, error: "SITEMAP_SYNC_SECRET missing" },
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

  const { error } = await supabaseAdmin.rpc("start_sitemap_sync_job");

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