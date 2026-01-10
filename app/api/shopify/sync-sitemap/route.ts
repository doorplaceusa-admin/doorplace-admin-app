import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  This endpoint:
  - Downloads the live Shopify sitemap
  - Extracts all /pages/ URLs
  - Saves them to Supabase
  - Prevents duplicates via upsert on slug

  You can call it via:
  - Browser (GET)
  - fetch() / cron / Postman (POST)
*/

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

async function run() {
  try {
    // 1) Download live sitemap
    const res = await fetch("https://doorplaceusa.com/sitemap.xml", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch sitemap");
    }

    const xml = await res.text();

    // 2) Extract all <loc> URLs
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const urls = matches.map(m => m[1]);

    // 3) Only keep Shopify /pages/ URLs
    const pageUrls = urls.filter(u => u.includes("/pages/"));

    // 4) Convert to slugs for Supabase
    const rows = pageUrls.map(url => {
      const slug = url.split("/pages/")[1];
      return {
        slug,
        url,
        source: "shopify",
        last_seen: new Date().toISOString(),
      };
    });

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No /pages/ URLs found in sitemap",
      });
    }

    // 5) Upsert into Supabase (prevents duplicates)
    const { error } = await supabaseAdmin
      .from("existing_shopify_pages")
      .upsert(rows, { onConflict: "slug" });

    if (error) throw error;

    // 6) Return stats
    return NextResponse.json({
      success: true,
      total_pages_found: pageUrls.length,
      inserted_or_updated: rows.length,
    });

  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
