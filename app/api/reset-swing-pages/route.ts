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

  const res = await shopifyFetch(`/pages.json?limit=200&order=updated_at desc`);
  const data = await res.json();
  const pages = data.pages || [];

  let fixed = 0;

  for (const page of pages) {

    let html = page.body_html || "";

    if (!html.includes("Porch Swing Guides")) continue;

    const start = html.indexOf("Porch Swing Guides");
    const footer = html.indexOf("footer");

    if (start === -1) continue;

    const cleaned =
      html.substring(0, start);

    await shopifyFetch(`/pages/${page.id}.json`, {
      method: "PUT",
      body: JSON.stringify({
        page: {
          id: page.id,
          body_html: cleaned
        }
      })
    });

    fixed++;

    console.log("Removed block:", page.handle);
  }

  console.log("DONE");

  return NextResponse.json({
    success: true,
    fixed
  });
}