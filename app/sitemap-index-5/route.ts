import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com";
const START = 240;

export async function GET() {
  try {

    const { count, error } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(error);
      return new NextResponse("Supabase error", { status: 500 });
    }

    const totalChunks = count || 0;

    let sitemapLinks = "";

    for (let i = START; i < totalChunks; i++) {
      sitemapLinks += `
<sitemap>
<loc>${SITEMAP_HOST}/sitemap/${i}.xml</loc>
</sitemap>`;
    }

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