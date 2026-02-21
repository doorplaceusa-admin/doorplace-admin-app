import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 50000; // Google maximum per sitemap
const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

export async function GET() {
  try {
    console.log("🧭 Generating TradePilot Sitemap Index...");

    // ======================================================
    // Count indexable URLs (fast head count)
    // ======================================================
   const { count, error } = await supabaseAdmin
  .from("shopify_url_inventory")
  .select("id", { count: "exact", head: true })
  .eq("is_active", true)
  .eq("is_indexable", true);

    if (error) {
      console.error("❌ Supabase count error:", error.message);
      return new NextResponse("Supabase count failed", { status: 500 });
    }

    const totalUrls = count ?? 0;

    const totalChunks =
      totalUrls === 0 ? 1 : Math.ceil(totalUrls / CHUNK_SIZE);

    console.log(`✅ Total URLs: ${totalUrls}`);
    console.log(`✅ Total Chunks: ${totalChunks}`);

    // ======================================================
    // Build Sitemap Index
    // ======================================================
    const sitemapLinks = Array.from({ length: totalChunks })
      .map(
        (_, i) => `
  <sitemap>
    <loc>${SITEMAP_HOST}/sitemap/${i}.xml</loc>
  </sitemap>`
      )
      .join("");

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