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
    console.error("❌ Shopify API Error:", res.status, text);
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
   POST /api/shopify/purge-oh-il
   Deletes ONLY corrupted pages ending in -oh-oh
------------------------------------------ */
export async function POST(req: Request) {
  const url = new URL(req.url);

  // ✅ Dry Run Mode
  const dryRun = url.searchParams.get("dry_run") === "1";

  console.log("=================================================");
  console.log("🚀 STARTING SHOPIFY PURGE: CORRUPTED -OH-OH PAGES");
  console.log("=================================================");
  console.log("🧪 Dry Run Mode:", dryRun);
  console.log("⏳ Shopify Store:", SHOP);
  console.log("-------------------------------------------------");

  // ✅ ONLY delete broken duplicated suffix pages
  const BAD_SUFFIXES = ["-oh-oh"];

  console.log("🚨 BAD SUFFIXES ACTIVE:");
  console.log(BAD_SUFFIXES);
  console.log("-------------------------------------------------");

  // ✅ Safety Limit (Prevents runaway deletion)
  const DELETE_LIMIT = 100000;

  // ✅ Slow throttle settings
  const DELETE_SLEEP_MS = 1200; // wait after EACH delete
  const BATCH_SLEEP_MS = 2000;  // wait after EACH batch fetch

  let checked = 0;
  let deleted = 0;
  let batchNumber = 0;
  let nextPageInfo: string | null = null;

  do {
    batchNumber++;

    console.log("=================================================");
    console.log(`📦 FETCHING BATCH #${batchNumber}...`);
    console.log("=================================================");

    // ✅ Shopify pagination fetch
    const res = await shopifyFetch(
      `/pages.json?limit=250${
        nextPageInfo ? `&page_info=${nextPageInfo}` : ""
      }`
    );

    const data = await res.json();
    const pages = data.pages || [];

    console.log(`✅ Batch Loaded: ${pages.length} pages`);

    checked += pages.length;
    console.log(`📊 Total Pages Checked So Far: ${checked}`);

    // ✅ Scan pages in batch
    for (const p of pages) {
      const handle = (p.handle || "").toLowerCase();

      // ✅ STRICT suffix match ONLY
      const matchedSuffix = BAD_SUFFIXES.find((suffix) =>
        handle.endsWith(suffix)
      );

      if (!matchedSuffix) continue;

      // ✅ LOG FULL PAGE INFO
      console.log("-------------------------------------------------");
      console.log("🗑️ CORRUPTED PAGE FOUND");
      console.log(`📄 Title: ${p.title}`);
      console.log(`🔑 Handle: ${p.handle}`);
      console.log(`🌐 URL: https://${SHOP}/pages/${p.handle}`);
      console.log(`⚠️ Matched Suffix: ${matchedSuffix}`);
      console.log(`🆔 Page ID: ${p.id}`);

      // ✅ Dry Run: Do not delete
      if (dryRun) {
        console.log("🧪 Dry Run ON → NOT deleting");
        continue;
      }

      // ✅ Delete Limit Safety Stop
      if (deleted >= DELETE_LIMIT) {
        console.log("🛑 DELETE LIMIT REACHED — STOPPING SAFELY");
        nextPageInfo = null;
        break;
      }

      // ✅ Real Delete
      console.log(`🔥 Deleting Page ID: ${p.id}...`);

      await shopifyFetch(`/pages/${p.id}.json`, {
        method: "DELETE",
      });

      deleted++;

      console.log("✅ DELETE SUCCESS");
      console.log(`✅ Deleted Page: ${p.title}`);
      console.log(`📉 Deleted Count So Far: ${deleted}`);

      // ✅ Slow down between deletes
      console.log(`⏳ Sleeping ${DELETE_SLEEP_MS}ms (throttle)...`);
      await sleep(DELETE_SLEEP_MS);
    }

    // ✅ Pagination: Get next page_info
    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);

    nextPageInfo = match ? match[1] : null;

    console.log("-------------------------------------------------");
    console.log(
      nextPageInfo
        ? `➡️ Next Batch Exists (page_info=${nextPageInfo})`
        : "🏁 No More Pages Remaining"
    );

    // ✅ Slow down between batches
    if (nextPageInfo) {
      console.log(`⏳ Sleeping ${BATCH_SLEEP_MS}ms before next batch...`);
      await sleep(BATCH_SLEEP_MS);
    }

  } while (nextPageInfo);

  console.log("=================================================");
  console.log("🎉 PURGE COMPLETE: CORRUPTED -OH-OH CLEANUP DONE");
  console.log("=================================================");
  console.log("✅ FINAL SUMMARY:");
  console.log("🧾 Total Pages Checked:", checked);
  console.log("🗑️ Total Pages Deleted:", deleted);
  console.log("🧪 Dry Run Mode:", dryRun);
  console.log("=================================================");

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    checked_pages: checked,
    deleted_pages: deleted,
  });
}
