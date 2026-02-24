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
  const url = `https://${SHOP}/admin/api/${API_VERSION}${path}`;

  console.log(`🌐 Shopify Fetch → ${options.method || "GET"} ${url}`);

  const res = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Shopify API Error:", res.status, text);
    throw new Error(`Shopify ${res.status}: ${text}`);
  }

  // Log rate-limit headers if present
  const callLimit =
    res.headers.get("x-shopify-shop-api-call-limit") ||
    res.headers.get("X-Shopify-Shop-Api-Call-Limit");
  if (callLimit) {
    console.log(`📉 Rate Limit Header: ${callLimit}`);
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
   Title Normalizer (max safety)
------------------------------------------ */
function normalizeTitle(raw: string) {
  return raw
    .replace(/\u00A0/g, " ") // nbsp -> space
    .replace(/\s+/g, " ") // collapse internal whitespace
    .trim()
    .toLowerCase();
}

type ShopifyPage = {
  id: number | string;
  title: string;
  handle: string;
  updated_at?: string;
  created_at?: string;
};

function asTime(s?: string) {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/* -----------------------------------------
   POST — Duplicate Title Cleanup (MAX LOGS)
------------------------------------------ */
export async function POST(req: Request) {
  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

  console.log("==================================================");
  console.log("🧹 DUPLICATE TITLE CLEANUP STARTED");
  console.log("🧪 Dry run:", dryRun);
  console.log("🏪 SHOP:", SHOP);
  console.log("📦 API_VERSION:", API_VERSION);
  console.log("⏱️ Started at:", new Date().toISOString());
  console.log("==================================================");

  let scanned = 0;
  let duplicates = 0;
  let deleted = 0;

  let pageBatch = 0;
  let nextPageInfo: string | null = null;

  // Group pages by normalized title (for accurate duplicate detection)
  const byTitle = new Map<string, ShopifyPage[]>();

  try {
    /* -----------------------------------------
       1) Fetch all pages (paginated)
    ------------------------------------------ */
    do {
      pageBatch++;

      console.log("--------------------------------------------------");
      console.log(`📦 Fetching page batch #${pageBatch}`);
      console.log(
        `➡️ page_info: ${nextPageInfo ? nextPageInfo : "(none / first page)"}`
      );

      const res = await shopifyFetch(
        `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
      );

      const data = await res.json();
      const pages: ShopifyPage[] = data.pages || [];

      console.log(`✅ Batch #${pageBatch} loaded — ${pages.length} pages`);

      // Dump first few items for sanity
      if (pages.length > 0) {
        console.log("🔍 Sample pages (first 5):");
        pages.slice(0, 5).forEach((p, i) => {
          console.log(
            `   [${i + 1}] id=${p.id} | title="${p.title}" | handle="${p.handle}" | updated_at=${p.updated_at}`
          );
        });
      }

      console.log("🧾 Processing pages in this batch...");

      for (const page of pages) {
        scanned++;

        if (!page?.title) {
          console.log(`⚠️ Skipping page with missing title (id=${page?.id})`);
          continue;
        }

        const key = normalizeTitle(page.title);

        // MAX LOGS: show every page processed
        console.log(
          `➡️ [SCAN #${scanned}] id=${page.id} | title="${page.title}" | key="${key}" | handle="${page.handle}" | updated_at=${page.updated_at}`
        );

        const arr = byTitle.get(key) || [];
        arr.push(page);
        byTitle.set(key, arr);

        // Running totals every 100 scans (plus you see every scan anyway)
        if (scanned % 100 === 0) {
          console.log(
            `📈 RUNNING TOTALS — Scanned: ${scanned}, DuplicateGroupsSoFar: ${Array.from(byTitle.values()).filter(g => g.length > 1).length}, Deleted: ${deleted}, DryRun: ${dryRun}`
          );
        }
      }

      // Pagination header parse
      const link = res.headers.get("link");
      console.log(`🔗 Link header: ${link || "(none)"}`);

      const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
      nextPageInfo = match ? match[1] : null;

      console.log(
        `📊 Batch #${pageBatch} DONE — Total scanned so far: ${scanned}`
      );

      if (nextPageInfo) {
        console.log(`➡️ Next page_info found, continuing... (${nextPageInfo})`);
      } else {
        console.log("✅ No next page_info — finished fetching all pages.");
      }
    } while (nextPageInfo);

    console.log("==================================================");
    console.log("✅ FETCH PHASE COMPLETE");
    console.log(`📌 Total pages scanned: ${scanned}`);
    console.log(`📌 Unique normalized titles: ${byTitle.size}`);
    console.log("==================================================");

    /* -----------------------------------------
       2) Find duplicate title groups + delete extras
    ------------------------------------------ */
    let groupIndex = 0;

    for (const [key, group] of byTitle.entries()) {
      if (group.length <= 1) continue;

      groupIndex++;

      // Count duplicates as extras beyond the first kept page
      duplicates += group.length - 1;

      // Sort by: newest updated_at, fallback created_at, fallback highest id
      const sorted = [...group].sort((a, b) => {
        const ta = asTime(a.updated_at) || asTime(a.created_at);
        const tb = asTime(b.updated_at) || asTime(b.created_at);
        if (tb !== ta) return tb - ta;

        const ida = typeof a.id === "string" ? parseInt(a.id, 10) : Number(a.id);
        const idb = typeof b.id === "string" ? parseInt(b.id, 10) : Number(b.id);
        return (idb || 0) - (ida || 0);
      });

      const keep = sorted[0];
      const remove = sorted.slice(1);

      console.log("--------------------------------------------------");
      console.log(`⚠️ DUPLICATE GROUP #${groupIndex}`);
      console.log(`🔑 normalized_title_key: "${key}"`);
      console.log(`🧮 group_size: ${group.length}`);
      console.log(
        `✅ KEEPING → id=${keep.id} | title="${keep.title}" | handle="${keep.handle}" | updated_at=${keep.updated_at} | created_at=${keep.created_at}`
      );

      console.log("🗑️ CANDIDATES TO REMOVE:");
      remove.forEach((p, idx) => {
        console.log(
          `   (${idx + 1}) id=${p.id} | title="${p.title}" | handle="${p.handle}" | updated_at=${p.updated_at} | created_at=${p.created_at}`
        );
      });

      if (!dryRun) {
        for (const p of remove) {
          console.log(
            `🗑️ DELETING → id=${p.id} | title="${p.title}" | handle="${p.handle}"`
          );

          await shopifyFetch(`/pages/${p.id}.json`, {
            method: "DELETE",
          });

          deleted++;

          console.log(
            `✅ DELETE OK → id=${p.id} | Deleted so far: ${deleted}`
          );

          // Sleep between deletes for rate limit safety
          await sleep(350);
        }
      } else {
        console.log("🧪 DRY RUN: No deletes executed for this group.");
      }

      console.log(
        `📊 TOTALS AFTER GROUP #${groupIndex} — Scanned: ${scanned}, DuplicatesFound: ${duplicates}, Deleted: ${deleted}`
      );
    }

    console.log("==================================================");
    console.log("🎉 DUPLICATE TITLE CLEANUP FINISHED");
    console.log(`✅ FINAL TOTALS — Scanned: ${scanned}`);
    console.log(`✅ FINAL TOTALS — Duplicate pages found: ${duplicates}`);
    console.log(`✅ FINAL TOTALS — Pages deleted: ${deleted}`);
    console.log(`🧪 Dry run: ${dryRun}`);
    console.log("⏱️ Finished at:", new Date().toISOString());
    console.log("==================================================");

    return NextResponse.json({
      success: true,
      dry_run: dryRun,
      pages_scanned: scanned,
      duplicate_pages_found: duplicates,
      pages_deleted: deleted,
    });
  } catch (err: any) {
    console.error("==================================================");
    console.error("❌ CLEANUP FAILED:", err);
    console.error("📌 Totals at failure:");
    console.error(`   Scanned: ${scanned}`);
    console.error(`   Duplicate pages found (so far): ${duplicates}`);
    console.error(`   Pages deleted (so far): ${deleted}`);
    console.error("⏱️ Failed at:", new Date().toISOString());
    console.error("==================================================");

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