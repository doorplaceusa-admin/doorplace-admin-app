import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ======================================================
   CONFIG
====================================================== */

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";

const BATCH_SIZE = 500;
const MAX_BATCHES_PER_RUN = 3;


const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;

/* ======================================================
   TYPES
====================================================== */

type SitemapEntry = {
  loc?: string;
  lastmod?: string;
};


/* ---------- Sleep Helper ---------- */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ======================================================
   POST /api/shopify/sync-sitemap
====================================================== */

export async function POST(req: Request) {
  console.log("===============================================");
  console.log("🚀 SHOPIFY SITEMAP SYNC STARTED ✅");
  console.log("ROOT:", ROOT_SITEMAP);
  console.log("SYNC SECRET LOADED:", Boolean(SYNC_SECRET));
  console.log("TIME:", new Date().toISOString());
  console.log("===============================================");

  try {
    /* -----------------------------------------
       AUTH
    ------------------------------------------ */
    if (!SYNC_SECRET) {
      throw new Error("❌ SITEMAP_SYNC_SECRET not set in env");
    }

    const headerSecret = req.headers.get("x-sync-secret");
    if (headerSecret !== SYNC_SECRET) {
      console.log("❌ Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* -----------------------------------------
       INPUT STATE (resume support)
    ------------------------------------------ */
    const { sitemapIndex = 0, urlOffset = 0 } = await req
      .json()
      .catch(() => ({}));

    console.log("📌 Resume State:", { sitemapIndex, urlOffset });

    /* -----------------------------------------
       FETCH ROOT SITEMAP INDEX (with retry)
    ------------------------------------------ */
    console.log("🌍 Fetching ROOT sitemap index...");

    const indexRes = await fetchWithRetry(ROOT_SITEMAP, 5);

    console.log("✅ ROOT fetch status:", indexRes.status);

    const indexXml = await indexRes.text();

    console.log("📄 ROOT XML Preview (first 500 chars):");
    console.log(indexXml.slice(0, 500));

    const sitemapUrls = extractLocs(indexXml);

    console.log("📦 Child sitemaps discovered:", sitemapUrls.length);

    if (!sitemapUrls.length) {
      throw new Error("❌ No child sitemaps found in ROOT sitemap index");
    }

    /* -----------------------------------------
       FINISHED ALL SITEMAPS
    ------------------------------------------ */
    if (sitemapIndex >= sitemapUrls.length) {
      console.log("===============================================");
      console.log("✅ Finished ALL sitemap sync runs.");
      console.log("Marking old URLs inactive...");
      console.log("===============================================");

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

    console.log("===============================================");
    console.log("📌 Fetching Child Sitemap:", sitemapUrl);
    console.log("Page Type:", pageType);
    console.log("===============================================");

    const childXml = await fetchXmlWithRetry(sitemapUrl, 5);

    console.log("📄 CHILD XML Preview (first 300 chars):");
    console.log(childXml.slice(0, 300));

    const entries = extractUrlEntries(childXml);

    console.log("🔗 URLs Found In Child Sitemap:", entries.length);

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
      console.log("-----------------------------------------------");
      console.log(
        `⚙️ Processing Batch ${batchesRun + 1}/${MAX_BATCHES_PER_RUN}`
      );
      console.log("Offset:", i);

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

      console.log("Rows prepared:", rows.length);

      if (rows.length) {
        const { error } = await supabaseAdmin
          .from("shopify_url_inventory")
          .upsert(rows, { onConflict: "url" });

        if (error) {
          console.error("❌ Supabase upsert error:", error);
          throw error;
        }

        upserted += rows.length;
      }

      batchesRun++;
i += BATCH_SIZE;

/* ✅ Add pacing so Shopify doesn’t throttle */
console.log("⏳ Sleeping 1.5s before next batch...");
if (i < entries.length) {
  console.log("⏳ Sleeping 1.5s before next batch...");
  await sleep(1500);
}

    }

    const doneWithSitemap = i >= entries.length;

    console.log("===============================================");
    console.log("✅ Batch Upsert Complete");
    console.log({
      upserted,
      sitemapIndex,
      doneWithSitemap,
      nextOffset: doneWithSitemap ? 0 : i,
    });
    console.log("===============================================");
if (doneWithSitemap) {
  console.log("⏳ Finished child sitemap. Sleeping 3s before next sitemap...");
  await sleep(3000);
}

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
    console.error("===============================================");
    console.error("❌ SITEMAP SYNC FAILED:");
    console.error("Message:", e.message);
    console.error("===============================================");

    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}


/* ======================================================
   FETCH HELPERS (Retry + Timeout)
====================================================== */

async function fetchWithRetry(url: string, retries = 5): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🌍 Attempt ${attempt}: Fetching ${url}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Googlebot/2.1 (+http://www.google.com/bot.html)",
          Accept: "application/xml,text/xml,*/*",
        },
      });

      clearTimeout(timeout);

      // ✅ Success
      if (res.ok) return res;

      console.log(`⚠️ Attempt ${attempt} failed: HTTP ${res.status}`);

      // ✅ Shopify Rate Limit Backoff (429)
      if (res.status === 429) {
        const delay = Math.min(60000, 3000 * attempt * attempt);

        console.log(
          `⏳ Shopify throttled (429). Waiting ${delay / 1000}s before retry...`
        );

        await new Promise((r) => setTimeout(r, delay));
      } else {
        // Normal short retry delay
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.log(`⚠️ Attempt ${attempt} error:`, err);

      const delay = Math.min(60000, 3000 * attempt);

      console.log(`⏳ Network error. Waiting ${delay / 1000}s...`);

      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error(`❌ Failed after ${retries} retries: ${url}`);
}


async function fetchXmlWithRetry(url: string, retries = 3): Promise<string> {
  const res = await fetchWithRetry(url, retries);
  return res.text();
}

/* ======================================================
   XML HELPERS
====================================================== */

function stripNamespaces(xml: string) {
  return xml.replace(/xmlns(:\w+)?="[^"]*"/g, "");
}

function extractLocs(xml: string): string[] {
  const clean = stripNamespaces(xml);

  const sitemapBlocks = [...clean.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)];

  return sitemapBlocks
    .map((block) => block[1].match(/<loc>(.*?)<\/loc>/)?.[1]?.trim())
    .filter((u): u is string => !!u && u.startsWith("http"));
}

function extractUrlEntries(xml: string): SitemapEntry[] {
  const clean = stripNamespaces(xml);
  const urls = [...clean.matchAll(/<url>([\s\S]*?)<\/url>/g)];

  return urls.map((block) => ({
    loc: block[1].match(/<loc>(.*?)<\/loc>/)?.[1]?.trim(),
    lastmod: block[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.trim(),
  }));
}

/* ======================================================
   NORMALIZE + PAGE TYPE
====================================================== */

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
