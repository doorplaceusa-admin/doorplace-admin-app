import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  Hard-coded Shopify sitemap sync.
  Uses ONLY the provided sitemap_pages_1.xml URL.
*/

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

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
    const sitemapUrl =
      "https://doorplaceusa.com/sitemap_pages_1.xml?from=81369595985&to=704635895889";

    const xml = await fetchXml(sitemapUrl);
    const urls = extractLocs(xml);

    if (!urls.length) {
      throw new Error("No URLs found in sitemap");
    }

    const now = new Date().toISOString();

    const rows = urls.map(url => {
      const slug = url
        .replace("https://doorplaceusa.com/pages/", "")
        .replace(/\/$/, "");

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
