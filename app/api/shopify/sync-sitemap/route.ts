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
    /* -----------------------------------------
       AUTH
    ------------------------------------------ */
    if (!SYNC_SECRET) {
      throw new Error("SITEMAP_SYNC_SECRET not set");
    }

    const headerSecret = req.headers.get("x-sync-secret");
    if (headerSecret !== SYNC_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* -----------------------------------------
       INPUT STATE
    ------------------------------------------ */
    const { sitemapIndex = 0, urlOffset = 0 } = await req
      .json()
      .catch(() => ({}));

    console.log("🚀 SHOPIFY SITEMAP SYNC", { sitemapIndex, urlOffset });

    /* -----------------------------------------
       FETCH ROOT SITEMAP INDEX
    ------------------------------------------ */
    const indexRes = await fetch(ROOT_SITEMAP, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/xml,text/xml,*/*",
      },
    });

    if (!indexRes.ok) {
      throw new Error(`Failed to fetch sitemap index (${indexRes.status})`);
    }

    const indexXml = await indexRes.text();

    console.log("INDEX XML PREVIEW:");
    console.log(indexXml.slice(0, 300));

    const sitemapUrls = extractLocs(indexXml);

    if (!sitemapUrls.length) {
      throw new Error("No child sitemaps found in sitemap index");
    }

    /* -----------------------------------------
       FINISHED ALL SITEMAPS
    ------------------------------------------ */
    if (sitemapIndex >= sitemapUrls.length) {
      console.log("✅ Finished all sitemap sync runs.");

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
       FETCH CURRENT CHILD SITEMAP
    ------------------------------------------ */
    const sitemapUrl = sitemapUrls[sitemapIndex];
    const pageType = inferPageType(sitemapUrl);

    console.log("📌 Fetching Child Sitemap:", sitemapUrl);

    const childXml = await fetchXml(sitemapUrl);
    const entries = extractUrlEntries(childXml);

    if (!entries.length) {
      console.log("⚠️ No URLs found in child sitemap.");

      return NextResponse.json({
        success: true,
        done: false,
        sitemapIndex: sitemapIndex + 1,
        urlOffset: 0,
      });
    }

    /* -----------------------------------------
       PROCESS URLS IN BATCHES
    ------------------------------------------ */
    const now = new Date().toISOString();
    let batchesRun = 0;
    let i = urlOffset;
    let upserted = 0;

    while (i < entries.length && batchesRun < MAX_BATCHES_PER_RUN) {
      const slice = entries.slice(i, i + BATCH_SIZE);

      const rows = slice
        .filter((e): e is { loc: string; lastmod?: string } => !!e.loc)
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

    console.log("✅ Batch Upsert Complete:", {
      upserted,
      sitemapIndex,
      doneWithSitemap,
    });

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

/* ---------- Fetch XML ---------- */
async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/xml,text/xml,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap (${res.status})`);
  }

  return res.text();
}

/* ---------- Strip XML Namespaces ---------- */
function stripNamespaces(xml: string) {
  return xml.replace(/xmlns(:\w+)?="[^"]*"/g, "");
}

/* ---------- Extract Child Sitemap URLs ---------- */
function extractLocs(xml: string): string[] {
  const clean = stripNamespaces(xml);

  const sitemapBlocks = [...clean.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)];

  return sitemapBlocks
    .map((block) => block[1].match(/<loc>(.*?)<\/loc>/)?.[1]?.trim())
    .filter((u): u is string => !!u && u.startsWith("http"));
}

/* ---------- Extract URL Entries ---------- */
function extractUrlEntries(xml: string): SitemapEntry[] {
  const clean = stripNamespaces(xml);
  const urls = [...clean.matchAll(/<url>([\s\S]*?)<\/url>/g)];

  return urls.map((block) => ({
    loc: block[1].match(/<loc>(.*?)<\/loc>/)?.[1]?.trim(),
    lastmod: block[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.trim(),
  }));
}

/* ---------- Normalize URLs ---------- */
function normalizeUrl(url: string) {
  return url.replace(/\/$/, "").toLowerCase();
}

/* ---------- Page Type Detection ---------- */
function inferPageType(sitemapUrl: string) {
  if (sitemapUrl.includes("products")) return "product";
  if (sitemapUrl.includes("collections")) return "collection";
  if (sitemapUrl.includes("pages")) return "page";
  if (sitemapUrl.includes("blogs")) return "blog";
  if (sitemapUrl.includes("articles")) return "article";
  return "unknown";
}
