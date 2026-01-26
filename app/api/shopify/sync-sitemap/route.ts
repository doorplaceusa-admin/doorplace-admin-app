import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";
const BATCH_SIZE = 1000;

export async function POST(req: Request) {
  try {
    const { sitemapIndex = 0 } = await req.json().catch(() => ({}));

    /* -----------------------------------------
       1. Fetch sitemap index
    ------------------------------------------ */
    const indexRes = await fetch(ROOT_SITEMAP, { cache: "no-store" });
    if (!indexRes.ok) throw new Error("Failed to fetch sitemap index");

    const indexXml = await indexRes.text();
    const sitemapUrls = extractLocs(indexXml);

    if (!sitemapUrls.length) {
      throw new Error("No child sitemaps found");
    }

    if (sitemapIndex >= sitemapUrls.length) {
      return NextResponse.json({
        success: true,
        done: true,
        total_sitemaps: sitemapUrls.length
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
        inserted: 0
      });
    }

    /* -----------------------------------------
       3. Chunk + upsert URLs
    ------------------------------------------ */
    const now = new Date().toISOString();

    let inserted = 0;

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const chunk = urls.slice(i, i + BATCH_SIZE).map(url => ({
        slug: url.replace("https://doorplaceusa.com/", "").replace(/\/$/, ""),
        url,
        source: "shopify",
        last_seen: now
      }));

      const { error } = await supabaseAdmin
        .from("existing_shopify_pages")
        .upsert(chunk, { onConflict: "slug" });

      if (error) throw error;

      inserted += chunk.length;
    }

    /* -----------------------------------------
       4. Return progress (NO TIMEOUT)
    ------------------------------------------ */
    return NextResponse.json({
      success: true,
      sitemapIndex: sitemapIndex + 1,
      sitemap_url: sitemapUrl,
      pages_processed: inserted,
      total_sitemaps: sitemapUrls.length
    });

  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/* -----------------------------------------
   Helpers
------------------------------------------ */

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch sitemap (${res.status})`);
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
