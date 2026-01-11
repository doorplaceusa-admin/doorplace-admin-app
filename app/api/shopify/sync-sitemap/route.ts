import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  Syncs all existing Shopify /pages/ URLs into Supabase
  so we never generate or push duplicates.
*/

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

async function run() {
  try {
    const sitemapUrl =
      "https://doorplaceusa.com/sitemap_pages_1.xml?from=81369595985&to=704516751441";

    const res = await fetch(sitemapUrl, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch sitemap (${res.status})`);
    }

    const xml = await res.text();

    // Extract all <loc> values
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const urls = matches.map(m => m[1]);

    // Only keep Shopify Pages
    const pageUrls = urls.filter(u => u.includes("/pages/"));

    if (pageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No /pages/ URLs found in sitemap"
      });
    }

    const now = new Date().toISOString();

    const rows = pageUrls.map(url => {
      const slug = url
        .split("/pages/")[1]
        .replace(/\/$/, ""); // remove trailing slash if present

      return {
        slug,
        url,
        source: "shopify",
        last_seen: now
      };
    });

    const { error } = await supabaseAdmin
      .from("existing_shopify_pages")
      .upsert(rows, { onConflict: "slug" });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      total_pages_found: rows.length
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
