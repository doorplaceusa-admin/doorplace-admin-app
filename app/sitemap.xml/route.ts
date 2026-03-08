import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOST = "https://tradepilot.doorplaceusa.com";

export async function GET() {
  try {
    console.log("Generating master sitemap");

    const sitemapIndexes = [
      `${HOST}/sitemap-index-1`,
      `${HOST}/sitemap-index-2`,
      `${HOST}/sitemap-index-3`,
      `${HOST}/sitemap-index-4`,
      `${HOST}/sitemap-index-5`,
      `${HOST}/sitemap-index-6`,
    ];

    const sitemapLinks = sitemapIndexes
      .map(
        (url) => `
<sitemap>
<loc>${url}</loc>
</sitemap>`
      )
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
    console.error("Master sitemap error:", err?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}