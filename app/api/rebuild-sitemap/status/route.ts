import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1) Load rebuild job status row
    const { data: job, error: jobError } = await supabaseAdmin
      .from("sitemap_rebuild_status")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (jobError) throw jobError;

    // 2) Get final chunk number (latest chunk in sitemap_chunks)
    const { data: lastRow, error: lastRowError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number")
      .order("chunk_number", { ascending: false })
      .limit(1);

    if (lastRowError) throw lastRowError;

    const finalChunkNumber = lastRow?.[0]?.chunk_number ?? 0;

    // 3) Total chunks = finalChunkNumber + 1 (because chunks are 0-based)
    const totalChunks = finalChunkNumber + 1;

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        final_chunk_number: finalChunkNumber,
        total_chunks: totalChunks,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || "Unknown error",
    });
  }
}