import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

/*
sitemap-index-2 handles chunk sitemaps 60–119
Each chunk sitemap contains 5,000 URLs
60 chunks × 5000 = 300,000 URLs
*/

const START = 60;
const TOTAL_CHUNKS = 60;

export async function GET() {
  try {
    console.log("Generating sitemap-index-2");

    const sitemapLinks = Array.from({ length: TOTAL_CHUNKS })
      .map((_, index) => {
        const chunk = START + index;

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
        "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
      },
    });

  } catch (err: any) {
    console.error("❌ sitemap-index-2 error:", err?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}