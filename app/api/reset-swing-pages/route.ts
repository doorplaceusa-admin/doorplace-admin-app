export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

async function shopifyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res;
}

export async function POST() {

  console.log("RESET SWING PAGES STARTED");

  let pageInfo: string | null = null;
  let fixed = 0;
  let scanned = 0;

  while (fixed < 200) {

    const res = await shopifyFetch(
      `/pages.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ""}`
    );

    const data = await res.json();
    const pages = data.pages || [];

    for (const page of pages) {

      scanned++;

      let html = page.body_html || "";

      if (!html.includes("Porch Swing Guides")) continue;

      const start = html.indexOf("Porch Swing Guides");

      if (start === -1) continue;

      const cleaned = html.substring(0, start);

      await shopifyFetch(`/pages/${page.id}.json`, {
        method: "PUT",
        body: JSON.stringify({
          page: {
  body_html: cleaned
}
        })
      });

      fixed++;

      console.log("Removed block:", page.handle);

      if (fixed >= 200) break;
    }

    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    pageInfo = match ? match[1] : null;

    if (!pageInfo) break;

    console.log(`Progress scanned=${scanned} fixed=${fixed}`);
  }

  console.log("DONE");

  return NextResponse.json({
    success: true,
    scanned,
    fixed
  });
}