import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ======================================================
   CONFIG
====================================================== */

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";
const BATCH_SIZE = 1000;
const MAX_BATCHES_PER_RUN = 5;
const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;

/* ======================================================
   TYPES
====================================================== */

type SitemapEntry = {
  loc?: string;
  lastmod?: string;
};

/* ======================================================
   POST /api/shopify/sync-sitemap
====================================================== */

export async function POST(req: Request) {
  console.log("SYNC SECRET LOADED:", Boolean(SYNC_SECRET));

  try {
    if (!SYNC_SECRET) {
      throw new Error("SITEMAP_SYNC_SECRET not set");
    }

    const headerSecret = req.headers.get("x-sync-secret");
    if (headerSecret !== SYNC_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sitemapIndex = 0,
      urlOffset = 0,
    } = await req.json().catch(() => ({}));

    console.log("🚀 SHOPIFY SITEMAP SYNC", { sitemapIndex, urlOffset });

    /* -----------------------------------------
       FETCH SITEMAP INDEX (BROWSER-SAFE)
    ------------------------------------------ */
    const indexRes = await fetch(ROOT_SITEMAP, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
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

    /* -----------------------------------------
       FINISHED ALL SITEMAPS
    ------------------------------------------ */
    if (sitemapIndex >= sitemapUrls.length) {
      await supabaseAdmin
        .from("shopify_url_inventory")
        .update({ is_active: false })
        .lt(
          "last_seen",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      return NextResponse.json({
        success: true,
        done: true,
        total_sitemaps: sitemapUrls.length,
      });
    }

    /* -----------------------------------------
       FETCH CHILD SITEMAP
    ------------------------------------------ */
    const sitemapUrl = sitemapUrls[sitemapIndex];
    const pageType = inferPageType(sitemapUrl);

    const xml = await fetchXml(sitemapUrl);
    const entries = extractUrlEntries(xml);

    if (!entries.length) {
      return NextResponse.json({
        success: true,
        done: false,
        sitemapIndex: sitemapIndex + 1,
        urlOffset: 0,
      });
    }

    /* -----------------------------------------
       PROCESS
    ------------------------------------------ */
    const now = new Date().toISOString();
    let batchesRun = 0;
    let i = urlOffset;
    let upserted = 0;

    while (i < entries.length && batchesRun < MAX_BATCHES_PER_RUN) {
      const slice = entries.slice(i, i + BATCH_SIZE);

      const rows = slice
        .filter(
          (e): e is { loc: string; lastmod?: string } =>
            typeof e.loc === "string"
        )
        .map((e) => ({
          url: normalizeUrl(e.loc),
          page_type: pageType,
          last_modified: e.lastmod ?? null,
          last_seen: now,
          is_active: true,
          source: "shopify_sitemap",
          updated_at: now,
        }));

      if (rows.length) {
        const { error } = await supabaseAdmin
          .from("shopify_url_inventory")
          .upsert(rows, { onConflict: "url" });

        if (error) throw error;
        upserted += rows.length;
      }

      batchesRun++;
      i += BATCH_SIZE;
    }

    const doneWithSitemap = i >= entries.length;

    return NextResponse.json({
      success: true,
      done: false,
      sitemapIndex: doneWithSitemap ? sitemapIndex + 1 : sitemapIndex,
      urlOffset: doneWithSitemap ? 0 : i,
      upserted,
      sitemap_url: sitemapUrl,
      total_sitemaps: sitemapUrls.length,
    });
  } catch (e: any) {
    console.error("❌ SITEMAP SYNC FAILED:", e);

    return NextResponse.json(
      { success: false, error: e.message },
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
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Accept: "application/xml,text/xml,*/*",
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

  return [...clean.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter(Boolean); // ✅ removes empty <loc>
}


function extractUrlEntries(xml: string): SitemapEntry[] {
  const clean = stripNamespaces(xml);
  const urls = [...clean.matchAll(/<url>([\s\S]*?)<\/url>/g)];

  return urls.map((block) => ({
    loc: block[1].match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: block[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));
}

function normalizeUrl(url: string) {
  return url.replace(/\/$/, "").toLowerCase();
}

function inferPageType(sitemapUrl: string) {
  if (sitemapUrl.includes("products")) return "product";
  if (sitemapUrl.includes("collections")) return "collection";
  if (sitemapUrl.includes("pages")) return "page";
  if (sitemapUrl.includes("blogs")) return "blog";
  if (sitemapUrl.includes("articles")) return "article";
  return "unknown";
}
