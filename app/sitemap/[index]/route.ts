import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ index: string }> }
) {
  try {
    const { index } = await context.params;
    const indexNum = parseInt(index, 10);

    if (isNaN(indexNum) || indexNum < 0) {
      return new NextResponse("Invalid sitemap index", { status: 400 });
    }

    // Instead of OFFSET, calculate ID boundaries
    const minId = indexNum * CHUNK_SIZE + 1;
    const maxId = minId + CHUNK_SIZE - 1;

    const { data, error } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url,last_modified")
      .eq("is_active", true)
      .eq("is_indexable", true)
      .gte("id", minId)
      .lte("id", maxId)
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase error:", error.message);
      return new NextResponse("Supabase error", { status: 500 });
    }

    if (!data || data.length === 0) {
      return new NextResponse("No URLs found", { status: 404 });
    }

    const urls = data
      .map(
        (row) => `
  <url>
    <loc>${row.url}</loc>
    <lastmod>${row.last_modified ?? new Date().toISOString()}</lastmod>
  </url>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err: any) {
    console.error("Sitemap generation error:", err?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}