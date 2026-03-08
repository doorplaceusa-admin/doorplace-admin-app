import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

const START = 240;

export async function GET() {
  try {
    console.log("Generating sitemap-index-5");

    const { count, error } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(error);
      return new NextResponse("Supabase query failed", { status: 500 });
    }

    const totalChunks = count || 0;

    const remaining = Math.max(totalChunks - START, 0);

    const sitemapLinks = Array.from({ length: remaining })
      .map((_, i) => {
        const chunk = START + i;

        return `
<sitemap>
<loc>${SITEMAP_HOST}/sitemap/${chunk}.xml</loc>
</sitemap>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=60"
      }
    });

  } catch (err) {
    console.error(err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}