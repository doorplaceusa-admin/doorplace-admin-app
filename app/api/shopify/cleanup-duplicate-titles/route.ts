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
    headers: { Allow: "POST, OPTIONS" },
  });
}

/* -----------------------------------------
   Sleep helper (rate limit safety)
------------------------------------------ */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -----------------------------------------
   Title Normalizer (safe)
------------------------------------------ */
function normalizeTitle(raw: string) {
  return raw
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
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
   Shopify Fetch Helper (clean logs)
------------------------------------------ */
async function shopifyFetch(path: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();
  // ✅ keep it short: do NOT print full URL
  console.log(`🌐 Shopify ${method} ${path}`);

  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Shopify ${res.status} ${path}`);
    throw new Error(`Shopify ${res.status}: ${text}`);
  }

  // Optional: short rate limit snapshot
  const callLimit =
    res.headers.get("x-shopify-shop-api-call-limit") ||
    res.headers.get("X-Shopify-Shop-Api-Call-Limit");
  if (callLimit) console.log(`📉 API calls: ${callLimit}`);

  return res;
}

/* -----------------------------------------
   POST — Duplicate Title Cleanup (CLEAN LOGS)
   - Default: clean summary logs
   - Add ?verbose=1 to print each duplicate group items
------------------------------------------ */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";
  const verbose = url.searchParams.get("verbose") === "1";

  console.log("==================================================");
  console.log(`🧹 Duplicate Title Cleanup START | dryRun=${dryRun} | verbose=${verbose}`);
  console.log(`⏱️ ${new Date().toISOString()}`);
  console.log("==================================================");

  let scanned = 0;
  let duplicates = 0;
  let deleted = 0;

  let pageBatch = 0;
  let nextPageInfo: string | null = null;

  // Group pages by normalized title
  const byTitle = new Map<string, ShopifyPage[]>();

  try {
    /* ---------------------------
       1) FETCH + GROUP (clean)
    ---------------------------- */
    do {
      pageBatch++;

      const res = await shopifyFetch(
        `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
      );

      const data = await res.json();
      const pages: ShopifyPage[] = data.pages || [];

      // Group
      for (const p of pages) {
        scanned++;
        if (!p?.title) continue;

        const key = normalizeTitle(p.title);
        const arr = byTitle.get(key) || [];
        arr.push(p);
        byTitle.set(key, arr);
      }

      // Pagination
      const link = res.headers.get("link");
      const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
      nextPageInfo = match ? match[1] : null;

      // ✅ Batch summary (readable)
      console.log(
        `📦 Batch #${pageBatch} | +${pages.length} pages | total_scanned=${scanned.toLocaleString()} | unique_titles=${byTitle.size.toLocaleString()}`
      );
    } while (nextPageInfo);

    console.log("--------------------------------------------------");
    console.log(
      `✅ Fetch complete | total_scanned=${scanned.toLocaleString()} | unique_titles=${byTitle.size.toLocaleString()}`
    );

    /* ---------------------------
       2) FIND DUP GROUPS (clean)
    ---------------------------- */
    let groupCount = 0;

    for (const [key, group] of byTitle.entries()) {
      if (group.length <= 1) continue;

      groupCount++;
      duplicates += group.length - 1;

      // Sort: newest updated, fallback created, fallback highest id
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

      // ✅ One-line group summary (easy to scan)
      console.log(
        `⚠️ DUP GROUP #${groupCount} | size=${group.length} | keep_id=${keep.id} | title="${keep.title}"`
      );

      // Optional: show details only when verbose=1
      if (verbose) {
        console.log(`   key="${key}"`);
        console.log(`   KEEP  id=${keep.id} handle=${keep.handle} updated=${keep.updated_at || ""}`);
        for (const p of remove) {
          console.log(`   DEL?  id=${p.id} handle=${p.handle} updated=${p.updated_at || ""}`);
        }
      }

      if (!dryRun) {
        for (const p of remove) {
          await shopifyFetch(`/pages/${p.id}.json`, { method: "DELETE" });
          deleted++;
          // ✅ short delete confirmation
          console.log(`🗑️ Deleted id=${p.id} | deleted_total=${deleted.toLocaleString()}`);
          await sleep(350);
        }
      }
    }

    console.log("==================================================");
    console.log(
      `🎉 DONE | scanned=${scanned.toLocaleString()} | dup_pages=${duplicates.toLocaleString()} | deleted=${deleted.toLocaleString()} | dryRun=${dryRun}`
    );
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
    console.error("❌ CLEANUP FAILED:", err?.message || err);
    console.error(
      `📌 Totals so far | scanned=${scanned.toLocaleString()} | dup_pages=${duplicates.toLocaleString()} | deleted=${deleted.toLocaleString()}`
    );
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