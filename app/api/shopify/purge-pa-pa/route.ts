import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* -----------------------------------------
   Shopify Fetch Helper
------------------------------------------ */
async function shopifyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}${path}`,
    {
      ...options,
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${text}`);
  }

  return res;
}

/* -----------------------------------------
   Sleep helper (rate limiting)
------------------------------------------ */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -----------------------------------------
   POST /api/shopify/purge-pa-pa
------------------------------------------ */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  console.log("🚀 Starting -pa-pa Shopify purge");
  console.log("🧪 Dry run:", dryRun);

  let checked = 0;
  let deleted = 0;
  let nextPageInfo: string | null = null;

  do {
    const res = await shopifyFetch(
      `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
    );

    const data = await res.json();
    const pages = data.pages || [];

    checked += pages.length;

    for (const p of pages) {
      const handle = (p.handle || "").toLowerCase();

      // ✅ Only delete the broken ones
      if (!handle.includes("-pa-pa")) continue;

      console.log(`🗑️ Found bad page: ${p.title} (${p.handle})`);

      if (!dryRun) {
        await shopifyFetch(`/pages/${p.id}.json`, {
          method: "DELETE",
        });

        deleted++;
        console.log(`✅ Deleted ${deleted} so far...`);

        await sleep(600);
      }
    }

    // Pagination
    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    nextPageInfo = match ? match[1] : null;
  } while (nextPageInfo);

  console.log("🎉 Purge complete");

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    checked_pages: checked,
    deleted_pages: deleted,
  });
}
