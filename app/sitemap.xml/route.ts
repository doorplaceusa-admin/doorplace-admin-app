import { NextResponse } from "next/server";

const SHOPIFY_SITEMAP_INDEX = "https://doorplaceusa.com/sitemap.xml";

export async function GET() {
  // Always fetch the live Shopify sitemap index
  const res = await fetch(SHOPIFY_SITEMAP_INDEX, {
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse("Failed to fetch Shopify sitemap", {
      status: 500,
    });
  }

  const xml = await res.text();

  // Serve it directly through TradePilot
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
