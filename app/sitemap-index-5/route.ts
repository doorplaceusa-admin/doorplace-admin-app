import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";

const START = 240;

export async function GET() {
  try {
    console.log("Generating sitemap-index-5");

    const { data, error } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number")
      .gte("chunk_number", START)
      .order("chunk_number", { ascending: true });

    if (error) {
      console.error(error);
      return new NextResponse("Supabase query failed", { status: 500 });
    }

    const sitemapLinks = (data || [])
      .map(
        (row) => `
<sitemap>
<loc>${SITEMAP_HOST}/sitemap/${row.chunk_number}.xml</loc>
</sitemap>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });

  } catch (err) {
    console.error(err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}