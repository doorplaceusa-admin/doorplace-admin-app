import { NextResponse } from "next/server";

const SHOPIFY_SITEMAP_INDEX = "https://doorplaceusa.com/sitemap.xml";

export async function GET() {
  const res = await fetch(SHOPIFY_SITEMAP_INDEX, {
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse("Failed to fetch Shopify sitemap index", {
      status: 500,
    });
  }

  let xml = await res.text();

  // Strip Shopify comments (keeps it clean for Google)
  xml = xml.replace(/<!--[\s\S]*?-->/g, "");

  // Return EXACT Shopify sitemap index with all 209 partitions
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
