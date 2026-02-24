import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sitemap_rebuild_status")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      job: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}