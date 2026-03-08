import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

export async function GET() {
  try {
    console.log("🧭 Generating TradePilot Sitemap Index...");

    const { data, error } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number")
      .order("chunk_number", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return new NextResponse("Supabase query failed", { status: 500 });
    }

    const sitemapLinks = (data || [])
      .map(
        (row) => `
  <sitemap>
    <loc>${SITEMAP_HOST}/sitemap/${row.chunk_number}.xml</loc>
  </sitemap>`
      )
      .join("");

    console.log(`✅ Total Chunks: ${data?.length || 0}`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
      },
    });
  } catch (err: any) {
    console.error("❌ Sitemap index generation error:", err?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}