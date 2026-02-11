// workers/purgeCorruptedPagesWorker.ts

/* ======================================================
   ✅ PURGE CORRUPTED SHOPIFY PAGES WORKER
   Deletes ONLY pages ending in corrupted suffixes like:

     -oh-oh

   Safe for PM2 + ts-node execution
====================================================== */

import dotenv from "dotenv";

/* ======================================================
   ✅ ENV LOADING (PM2 SAFE)
   Node workers do NOT auto-load .env.local
====================================================== */

dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

/* ======================================================
   CONFIG (STRICT SAFE)
====================================================== */

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2024-01";

/* ======================================================
   HARD STOP IF ENV MISSING
====================================================== */

if (!SHOP || !TOKEN) {
  console.error("❌ Missing Shopify ENV vars — exiting immediately");
  process.exit(1);
}

/* ======================================================
   ✅ TypeScript-Safe Constants
   Prevents "string | undefined" header errors forever
====================================================== */

const SHOPIFY_STORE = SHOP;
const SHOPIFY_TOKEN = TOKEN;

/* ======================================================
   DEBUG CHECK
====================================================== */

console.log("SHOPIFY ENV CHECK:", {
  STORE_DOMAIN: SHOPIFY_STORE,
  TOKEN_PREVIEW: SHOPIFY_TOKEN.slice(0, 10) + "...",
});

/* ======================================================
   WORKER SETTINGS
====================================================== */

// ✅ Corrupted suffixes to purge
const BAD_SUFFIXES = ["-oh-oh"];

// ✅ Safety limit (prevents runaway deletion)
const DELETE_LIMIT = 100000;

// ✅ Throttle timing
const DELETE_SLEEP_MS = 1200;
const BATCH_SLEEP_MS = 2000;

// ✅ Dry Run Mode toggle
const DRY_RUN = true; // ⚠️ ALWAYS RUN TRUE FIRST

/* ======================================================
   HELPERS
====================================================== */

async function shopifyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}${path}`,
    {
      ...options,
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ======================================================
   MAIN PURGE FUNCTION
====================================================== */

async function purgeCorruptedPages() {
  console.log("=================================================");
  console.log("🚀 STARTING PURGE WORKER");
  console.log("=================================================");
  console.log("🧪 Dry Run Mode:", DRY_RUN);
  console.log("🚨 BAD SUFFIXES:", BAD_SUFFIXES);
  console.log("-------------------------------------------------");

  let checked = 0;
  let deleted = 0;
  let batchNumber = 0;
  let nextPageInfo: string | null = null;

  do {
    batchNumber++;

    console.log("=================================================");
    console.log(`📦 FETCHING BATCH #${batchNumber}`);
    console.log("=================================================");

    // ✅ Stable pagination ordering required by Shopify
    const res = await shopifyFetch(
      `/pages.json?limit=250&order=updated_at asc${
        nextPageInfo ? `&page_info=${nextPageInfo}` : ""
      }`
    );

    const data = await res.json();
    const pages = data.pages || [];

    console.log(`✅ Loaded ${pages.length} pages`);

    checked += pages.length;
    console.log(`📊 Total Checked: ${checked}`);

    /* -----------------------------------------
       SCAN + DELETE MATCHED PAGES
    ----------------------------------------- */
    for (const p of pages) {
      const handle = (p.handle || "").toLowerCase();

      const matchedSuffix = BAD_SUFFIXES.find((suffix) =>
        handle.endsWith(suffix)
      );

      if (!matchedSuffix) continue;

      console.log("-------------------------------------------------");
      console.log("🗑️ CORRUPTED PAGE FOUND");
      console.log(`📄 Title: ${p.title}`);
      console.log(`🔑 Handle: ${p.handle}`);
      console.log(`⚠️ Matched: ${matchedSuffix}`);
      console.log(`🆔 Page ID: ${p.id}`);

      // ✅ Dry Run Mode
      if (DRY_RUN) {
        console.log("🧪 Dry Run ON → NOT deleting");
        continue;
      }

      // ✅ Safety Stop
      if (deleted >= DELETE_LIMIT) {
        console.log("🛑 DELETE LIMIT REACHED — STOPPING SAFELY");
        nextPageInfo = null;
        break;
      }

      // ✅ Delete Page
      console.log(`🔥 Deleting Page ID: ${p.id}...`);

      await shopifyFetch(`/pages/${p.id}.json`, {
        method: "DELETE",
      });

      deleted++;

      console.log("✅ DELETE SUCCESS");
      console.log(`📉 Deleted Count: ${deleted}`);

      // ✅ Throttle between deletes
      await sleep(DELETE_SLEEP_MS);
    }

    /* -----------------------------------------
       PAGINATION
    ----------------------------------------- */
    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);

    nextPageInfo = match ? match[1] : null;

    console.log("-------------------------------------------------");
    console.log(
      nextPageInfo
        ? `➡️ Next Batch Exists (page_info=${nextPageInfo})`
        : "🏁 No More Pages Remaining"
    );

    if (nextPageInfo) {
      console.log(`⏳ Sleeping ${BATCH_SLEEP_MS}ms before next batch...`);
      await sleep(BATCH_SLEEP_MS);
    }
  } while (nextPageInfo);

  console.log("=================================================");
  console.log("🎉 PURGE WORKER COMPLETE");
  console.log("=================================================");
  console.log("✅ FINAL SUMMARY:");
  console.log("🧾 Total Checked:", checked);
  console.log("🗑️ Total Deleted:", deleted);
  console.log("🧪 Dry Run Mode:", DRY_RUN);
  console.log("=================================================");
}

/* ======================================================
   RUN ONCE (PM2 WORKER MODE)
====================================================== */

console.log("🔥 Purge Corrupted Pages Worker Started (PM2 Mode)");

purgeCorruptedPages()
  .then(() => {
    console.log("✅ Purge Worker finished cleanly.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Purge Worker failed:", err);
    process.exit(1);
  });
