import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 50000; // Google max
const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

export async function GET() {
  try {
    console.log("🧭 Generating TradePilot Sitemap Index...");

    const { count, error } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("id", { count: "exact", head: true })
      .eq("page_type", "page")
      .eq("is_active", true)
      .eq("is_indexable", true);

    if (error || count === null) {
      console.error("❌ Sitemap count error:", error);
      return new NextResponse("Supabase count failed", { status: 500 });
    }

    const totalChunks = Math.max(1, Math.ceil(count / CHUNK_SIZE));

    console.log(`✅ Total URLs: ${count}`);
    console.log(`✅ Total Chunks: ${totalChunks}`);

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
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err) {
    console.error("❌ Sitemap index generation error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}