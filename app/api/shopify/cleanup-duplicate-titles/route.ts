export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: { Allow: "POST, OPTIONS" },
  });
}

async function shopifyFetch(path: string, options: RequestInit = {}) {
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
    console.error("❌ Shopify API Error:", res.status, text);
    throw new Error(`Shopify ${res.status}: ${text}`);
  }
  return res;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Normalizes tricky whitespace + casing issues safely
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
  updated_at?: string; // REST Admin uses updated_at
  created_at?: string;
};

function asTime(s?: string) {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : 0;
}

export async function POST(req: Request) {
  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

  console.log("🧹 DUPLICATE TITLE CLEANUP STARTED");
  console.log("🧪 Dry run:", dryRun);

  let scanned = 0;
  let duplicates = 0;
  let deleted = 0;
  let pageBatch = 0;
  let nextPageInfo: string | null = null;

  // Collect pages by normalized title
  const byTitle = new Map<string, ShopifyPage[]>();

  try {
    // 1) Fetch all pages (paginated)
    do {
      pageBatch++;
      console.log(`📦 Fetching page batch #${pageBatch}`);

      const res = await shopifyFetch(
        `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
      );

      const data = await res.json();
      const pages: ShopifyPage[] = data.pages || [];

      console.log(`🔎 Batch #${pageBatch} loaded — ${pages.length} pages`);

      for (const page of pages) {
        scanned++;
        if (!page?.title) continue;

        const key = normalizeTitle(page.title);
        const arr = byTitle.get(key) || [];
        arr.push(page);
        byTitle.set(key, arr);
      }

      const link = res.headers.get("link");
      const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
      nextPageInfo = match ? match[1] : null;
    } while (nextPageInfo);

    // 2) Identify duplicate groups (same normalized title)
    for (const [key, group] of byTitle.entries()) {
      if (group.length <= 1) continue;

      // True duplicates by title normalization
      duplicates += group.length - 1;

      // Sort: keep newest updated_at, fallback created_at, fallback highest id
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

      console.log("⚠️ DUPLICATE TITLE GROUP:");
      console.log(`   key: "${key}"`);
      console.log(
        `   keeping: ${keep.title} | handle=${keep.handle} | id=${keep.id} | updated_at=${keep.updated_at}`
      );

      for (const p of remove) {
        console.log(
          `   removing: ${p.title} | handle=${p.handle} | id=${p.id} | updated_at=${p.updated_at}`
        );
      }

      // 3) Delete extras
      if (!dryRun) {
        for (const p of remove) {
          await shopifyFetch(`/pages/${p.id}.json`, { method: "DELETE" });
          deleted++;
          await sleep(350);
        }
      }
    }

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