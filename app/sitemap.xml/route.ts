import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  // Count total URLs
  const { count, error } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("*", { count: "exact", head: true });

  if (error || !count) {
    return new NextResponse("Count error", { status: 500 });
  }

  const CHUNK_SIZE = 50000;
  const totalSitemaps = Math.ceil(count / CHUNK_SIZE);

  // Build sitemap index
  const sitemapLinks = Array.from({ length: totalSitemaps }).map((_, i) => {
    return `
      <sitemap>
        <loc>https://tradepilot.doorplaceusa.com/sitemap-${i}.xml</loc>
      </sitemap>
    `;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks.join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
