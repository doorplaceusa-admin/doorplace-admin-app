import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";
const BATCH_SIZE = 1000;
const MAX_BATCHES_PER_RUN = 5; // ⛔ hard cap per request (5k URLs)

/* ======================================================
   POST /api/shopify/sync-sitemap
====================================================== */

export async function POST(req: Request) {
  try {
    const {
      sitemapIndex = 0,
      urlOffset = 0,
    } = await req.json().catch(() => ({}));

    console.log("🚀 SITEMAP SYNC START", { sitemapIndex, urlOffset });

    /* -----------------------------------------
       1. Fetch sitemap index
    ------------------------------------------ */
    const indexRes = await fetch(ROOT_SITEMAP, {
      cache: "no-store",
      headers: {
        "User-Agent": "TradePilot Sitemap Sync",
        "Accept": "application/xml,text/xml,*/*",
      },
    });

    if (!indexRes.ok) {
      throw new Error(`Failed to fetch sitemap index (${indexRes.status})`);
    }

    const indexXml = await indexRes.text();
    const sitemapUrls = extractLocs(indexXml);

    if (!sitemapUrls.length) {
      throw new Error("No child sitemaps found");
    }

    // ✅ All sitemaps finished
    if (sitemapIndex >= sitemapUrls.length) {
      return NextResponse.json({
        success: true,
        done: true,
        total_sitemaps: sitemapUrls.length,
      });
    }

    /* -----------------------------------------
       2. Fetch ONE child sitemap
    ------------------------------------------ */
    const sitemapUrl = sitemapUrls[sitemapIndex];

    const xml = await fetchXml(sitemapUrl);
    const urls = extractLocs(xml);

    if (!urls.length) {
      return NextResponse.json({
        success: true,
        sitemapIndex: sitemapIndex + 1,
        urlOffset: 0,
        done: false,
      });
    }

    /* -----------------------------------------
       3. Process LIMITED batches (SAFE)
    ------------------------------------------ */
    const now = new Date().toISOString();
    let inserted = 0;
    let batchesRun = 0;

    let i = urlOffset;

    while (i < urls.length && batchesRun < MAX_BATCHES_PER_RUN) {
      const slice = urls.slice(i, i + BATCH_SIZE);

      // 🔒 Deduplicate slugs INSIDE THIS CHUNK
      const uniqueMap = new Map<string, string>();

      for (const url of slice) {
        const slug = normalizeSlug(url);
        if (!uniqueMap.has(slug)) {
          uniqueMap.set(slug, url);
        }
      }

      const chunk = Array.from(uniqueMap.entries()).map(([slug, url]) => ({
        slug,
        url,
        source: "shopify",
        last_seen: now,
      }));

      if (chunk.length) {
        const { error } = await supabaseAdmin
          .from("existing_shopify_pages")
          .upsert(chunk, { onConflict: "slug" });

        if (error) throw error;

        inserted += chunk.length;
      }

      batchesRun++;
      i += BATCH_SIZE;
    }

    /* -----------------------------------------
       4. Decide next cursor
    ------------------------------------------ */
    const doneWithSitemap = i >= urls.length;

    return NextResponse.json({
      success: true,
      done: false,
      sitemapIndex: doneWithSitemap ? sitemapIndex + 1 : sitemapIndex,
      urlOffset: doneWithSitemap ? 0 : i,
      pages_processed: inserted,
      sitemap_url: sitemapUrl,
      total_sitemaps: sitemapUrls.length,
    });

  } catch (e: any) {
    console.error("❌ SITEMAP SYNC FAILED:", e);

    return NextResponse.json(
      {
        success: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}

/* ======================================================
   HELPERS
====================================================== */

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "TradePilot Sitemap Sync",
      "Accept": "application/xml,text/xml,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap (${res.status})`);
  }

  return res.text();
}

function stripNamespaces(xml: string) {
  return xml
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")
    .replace(/<\/?\w+:/g, "<")
    .replace(/<\/\w+:/g, "</");
}

function extractLocs(xml: string): string[] {
  const clean = stripNamespaces(xml);
  return [...clean.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
}

function normalizeSlug(url: string) {
  return url
    .replace("https://doorplaceusa.com/", "")
    .replace(/\/$/, "")
    .toLowerCase()
    .replace(/\/+/g, "/");
}
