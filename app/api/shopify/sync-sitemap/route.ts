import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  This version pulls directly from your sitemap_pages_1.xml
  (the URL you provided) and stores all the page URLs in Supabase.

  You can call it in the browser, like:
    https://tradepilot.doorplaceusa.com/api/shopify/sync-sitemap
*/

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

async function run() {
  try {
    // Fetch the actual pages sitemap
    const sitemapUrl = "https://doorplaceusa.com/sitemap_pages_1.xml?from=81369595985&to=704516751441";
    const res = await fetch(sitemapUrl, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch sitemap: ${res.status}`);
    }

    const xml = await res.text();

    // Extract all <loc> URLs
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const urls = matches.map(m => m[1]);

    // Filter only the /pages/ URLs
    const pageUrls = urls.filter(u => u.includes("/pages/"));

    if (pageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No /pages/ URLs found in that sitemap",
      });
    }

    const rows = pageUrls.map(url => {
      const slug = url.split("/pages/")[1];
      return {
        slug,
        url,
        source: "shopify",
        last_seen: new Date().toISOString(),
      };
    });

    // Upsert into Supabase (prevents duplicates)
    const { error } = await supabaseAdmin
      .from("existing_shopify_pages")
      .upsert(rows, { onConflict: "slug" });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      total_pages_found: pageUrls.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

