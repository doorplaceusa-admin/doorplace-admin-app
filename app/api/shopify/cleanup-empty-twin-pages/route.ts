import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* -----------------------------------------
   Shopify Fetch Helper
------------------------------------------ */
async function shopifyFetch(
  path: string,
  options: RequestInit = {}
) {
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
    throw new Error(`Shopify error ${res.status}`);
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
   Visual empty check
------------------------------------------ */


/* -----------------------------------------
   POST
------------------------------------------ */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  console.log("🚀 Starting Twin Porch Swing cleanup");
  console.log("🧪 Dry run:", dryRun);

  let checked = 0;
  let candidates = 0;
  let deleted = 0;

  let nextPageInfo: string | null = null;
  let pageBatch = 0;

  do {
    pageBatch++;

    console.log(`📦 Fetching page batch #${pageBatch}`);

    const pageRes = await shopifyFetch(
      `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
    );

    const data = await pageRes.json();
    const pages = data.pages || [];

    checked += pages.length;

    console.log(
      `🔎 Batch #${pageBatch} loaded — ${pages.length} pages (checked so far: ${checked})`
    );

    for (const p of pages) {
      const title = (p.title || "").toLowerCase();

      if (!title.startsWith("twin porch swing")) continue;

      candidates++;

      console.log(
        `👀 Candidate #${candidates}: ${p.title} (id: ${p.id})`
      );

      if (!dryRun) {
        console.log(`🗑️ Deleting page ${p.id}…`);

        await shopifyFetch(`/pages/${p.id}.json`, {
          method: "DELETE",
        });

        deleted++;

        console.log(
          `✅ Deleted ${deleted}/${candidates} — sleeping to avoid 429`
        );

        // ⏳ Shopify REST rate limit safety
        await sleep(550);
      }
    }

    const link = pageRes.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    nextPageInfo = match ? match[1] : null;

    if (nextPageInfo) {
      console.log("➡️ Moving to next page batch");
    }

  } while (nextPageInfo);

  console.log("🎉 Cleanup complete");
  console.log("📊 Checked pages:", checked);
  console.log("📌 Candidates found:", candidates);
  console.log("🗑️ Pages deleted:", deleted);

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    checked_pages: checked,
    candidate_count: candidates,
    deleted_count: deleted,
  });
}
