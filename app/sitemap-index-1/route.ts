import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

export async function GET() {
  try {

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap>
<loc>${SITEMAP_HOST}/test-sitemap-chunk.xml</loc>
</sitemap>
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
      },
    });

  } catch (err: any) {
    console.error("Test sitemap error:", err?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}