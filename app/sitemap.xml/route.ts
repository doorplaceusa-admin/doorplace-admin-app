import { NextResponse } from "next/server";

const TOTAL_CHUNKS = 500000 / 50000; // 10 chunks if 500k pages

export async function GET() {
  const chunks = Math.ceil(TOTAL_CHUNKS);

  const sitemapLinks = Array.from({ length: chunks })
    .map((_, i) => {
      return `
<sitemap>
  <loc>https://tradepilot.doorplaceusa.com/sitemap/${i}</loc>
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
    },
  });
}
