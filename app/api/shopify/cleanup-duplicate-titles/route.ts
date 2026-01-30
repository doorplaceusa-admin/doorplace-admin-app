export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* -----------------------------------------
   CORS / Preflight (REQUIRED)
------------------------------------------ */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      Allow: "POST, OPTIONS",
    },
  });
}

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
        ...(options.headers || {}),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Shopify API Error:", res.status, text);
    throw new Error(`Shopify ${res.status}: ${text}`);
  }

  return res;
}

/* -----------------------------------------
   Sleep helper (rate limit safety)
------------------------------------------ */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -----------------------------------------
   POST — Duplicate Title Cleanup
------------------------------------------ */
export async function POST(req: Request) {
  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

  console.log("🧹 DUPLICATE TITLE CLEANUP STARTED");
  console.log("🧪 Dry run:", dryRun);

  let scanned = 0;
  let duplicates = 0;
  let deleted = 0;
  let pageBatch = 0;
  let nextPageInfo: string | null = null;

  // Track seen titles (memory-light)
  const seenTitles = new Set<string>();

  try {
    do {
      pageBatch++;

      console.log(`📦 Fetching page batch #${pageBatch}`);

      const res = await shopifyFetch(
        `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
      );

      const data = await res.json();
      const pages = data.pages || [];

      console.log(
        `🔎 Batch #${pageBatch} loaded — ${pages.length} pages`
      );

      for (const page of pages) {
        scanned++;

        if (!page.title) continue;

        const key = page.title.trim().toLowerCase();

        if (seenTitles.has(key)) {
          duplicates++;

          console.log(
            `🗑️ DUPLICATE FOUND → ${page.title} (id: ${page.id})`
          );

          if (!dryRun) {
            await shopifyFetch(`/pages/${page.id}.json`, {
              method: "DELETE",
            });

            deleted++;
            await sleep(350); // Shopify rate safety
          }
        } else {
          seenTitles.add(key);
        }
      }

      console.log(
        `📊 Progress — Scanned: ${scanned}, Duplicates: ${duplicates}, Deleted: ${deleted}`
      );

      const link = res.headers.get("link");
      const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
      nextPageInfo = match ? match[1] : null;

      if (nextPageInfo) {
        console.log("➡️ Moving to next page batch");
      }
    } while (nextPageInfo);

    console.log("🎉 DUPLICATE TITLE CLEANUP FINISHED");

    return NextResponse.json({
      success: true,
      dry_run: dryRun,
      pages_scanned: scanned,
      duplicate_pages_found: duplicates,
      pages_deleted: deleted,
    });
  } catch (err: any) {
    console.error("❌ CLEANUP FAILED:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Cleanup failed",
        pages_scanned: scanned,
        duplicate_pages_found: duplicates,
        pages_deleted: deleted,
      },
      { status: 500 }
    );
  }
}
