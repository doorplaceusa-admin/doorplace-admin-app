import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;

export async function GET(
  req: Request,
  { params }: { params: { index: string } }
) {
  try {
    const indexNum = parseInt(params.index, 10);
    if (isNaN(indexNum) || indexNum < 0) {
      return new NextResponse("Invalid sitemap index", { status: 400 });
    }

    // Step 1: Find the starting ID for this chunk
    const startOffset = indexNum * CHUNK_SIZE;

    const { data: startRow, error: startError } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("id")
      .eq("is_active", true)
      .eq("is_indexable", true)
      .order("id", { ascending: true })
      .range(startOffset, startOffset);

    if (startError || !startRow || startRow.length === 0) {
      return new NextResponse("No data", { status: 404 });
    }

    const startId = startRow[0].id;

    // Step 2: Fetch next CHUNK_SIZE rows using cursor
    const { data, error } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url,last_modified")
      .eq("is_active", true)
      .eq("is_indexable", true)
      .gt("id", startId - 1)
      .order("id", { ascending: true })
      .limit(CHUNK_SIZE);

    if (error) {
      console.error("Supabase error:", error.message);
      return new NextResponse("Supabase error", { status: 500 });
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