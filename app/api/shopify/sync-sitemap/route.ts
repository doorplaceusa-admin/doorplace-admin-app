import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  Shopify Sitemap FULL Sync
  - Reads sitemap index
  - Loops all child sitemaps
  - Deduplicates URLs
  - Matches Google Search Console counts
*/

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";

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

async function run() {
  try {
    /* -----------------------------------------
       1. Fetch sitemap index
    ------------------------------------------ */
    const indexXml = await fetchXml(ROOT_SITEMAP);
    const sitemapUrls = extractLocs(indexXml);

    if (!sitemapUrls.length) {
      throw new Error("No child sitemaps found in sitemap index");
    }

    /* -----------------------------------------
       2. Fetch ALL child sitemaps
    ------------------------------------------ */
    let allUrls: string[] = [];

    for (const sitemapUrl of sitemapUrls) {
      const xml = await fetchXml(sitemapUrl);
      const urls = extractLocs(xml);
      allUrls.push(...urls);
    }

    /* -----------------------------------------
       3. Deduplicate URLs
    ------------------------------------------ */
    allUrls = Array.from(new Set(allUrls));

    if (!allUrls.length) {
      throw new Error("No URLs found across all sitemaps");
    }

    /* -----------------------------------------
       4. Prepare rows for Supabase
    ------------------------------------------ */
    const now = new Date().toISOString();

    const rows = allUrls.map(url => {
      const slug = url
        .replace("https://doorplaceusa.com/", "")
        .replace(/\/$/, "");

      return {
        slug,
        url,
        source: "shopify",
        last_seen: now
      };
    });

    /* -----------------------------------------
       5. Upsert into Supabase
    ------------------------------------------ */
    const { error } = await supabaseAdmin
      .from("existing_shopify_pages")
      .upsert(rows, { onConflict: "slug" });

    if (error) throw error;

    /* -----------------------------------------
       6. Success response
    ------------------------------------------ */
    return NextResponse.json({
      success: true,
      sitemaps_found: sitemapUrls.length,
      total_pages_found: rows.length
    });

  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
