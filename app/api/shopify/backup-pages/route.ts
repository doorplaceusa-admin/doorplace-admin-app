// app/api/shopify/backup-pages/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const pages: any[] = [];
  let nextPageUrl =
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/pages.json?limit=250`;

  while (nextPageUrl) {
    const res = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
      },
    });

    const data = await res.json();
    pages.push(...data.pages);

    const link = res.headers.get("link");
    const match = link?.match(/<([^>]+)>; rel="next"/);
    nextPageUrl = match ? match[1] : "";
  }

  return NextResponse.json({
    success: true,
    count: pages.length,
    pages,
  });
}
