import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {

  /**
   * 1️⃣ SUMMARY (ALL TIME, AGGREGATED)
   */
  const { data: summaryRows, error: summaryError } = await supabaseAdmin
    .from("google_search_console_daily")
    .select("clicks, impressions, ctr, position")

  if (summaryError) {
    return NextResponse.json({ error: summaryError.message }, { status: 500 });
  }

  const totalClicks =
    summaryRows?.reduce((sum, r) => sum + (r.clicks || 0), 0) ?? 0;

  const totalImpressions =
    summaryRows?.reduce((sum, r) => sum + (r.impressions || 0), 0) ?? 0;

  const avgCtr =
    summaryRows && summaryRows.length
      ? summaryRows.reduce((sum, r) => sum + (r.ctr || 0), 0) /
        summaryRows.length
      : 0;

  const avgPosition =
    summaryRows && summaryRows.length
      ? summaryRows.reduce((sum, r) => sum + (r.position || 0), 0) /
        summaryRows.length
      : 0;

  /**
   * 2️⃣ TOP PAGES (GROUPED — NO DUPLICATES)
   */
  const { data: topPages, error: pagesError } = await supabaseAdmin.rpc(
    "google_top_pages",
  );

  if (pagesError) {
    return NextResponse.json({ error: pagesError.message }, { status: 500 });
  }

  /**
   * 3️⃣ TOP QUERIES (GROUPED — NO DUPLICATES)
   */
  const { data: topQueries, error: queriesError } = await supabaseAdmin.rpc(
    "google_top_queries",
{}  );

  if (queriesError) {
    return NextResponse.json({ error: queriesError.message }, { status: 500 });
  }

  /**
   * 4️⃣ LAST UPDATED TIMESTAMP
   */
  const { data: lastRow } = await supabaseAdmin
    .from("google_search_console_daily")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    summary: {
      totalClicks,
      totalImpressions,
      avgCtr,
      avgPosition,
    },
    topPages: topPages ?? [],
    topQueries: topQueries ?? [],
    updatedAt: lastRow?.date ?? null,
  });
}
