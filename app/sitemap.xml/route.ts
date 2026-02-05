import { NextResponse } from "next/server";

const SHOPIFY_REAL = "https://doorplaceusa.myshopify.com/sitemap.xml";

export async function GET() {
  const res = await fetch(SHOPIFY_REAL, {
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse("Shopify sitemap fetch failed", { status: 500 });
  }

  const xml = await res.text();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
