import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 50000; // Google max URLs per sitemap
const INTERNAL_BATCH = 1000; // Safe Supabase batch size (prevents range failures)

/* -------------------------------------------------------
   XML Escaper (prevents broken XML)
------------------------------------------------------- */
function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ index: string }> }
) {
  const { index } = await context.params;

  const indexNum = parseInt(index, 10);

  if (isNaN(indexNum) || indexNum < 0) {
    return new NextResponse("Invalid sitemap index", { status: 400 });
  }

  try {
    const from = indexNum * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;

    // ----------------------------------------------------
    // Fetch the chunk in safe INTERNAL batches
    // ----------------------------------------------------
    let allRows: { url: string; last_modified: string | null }[] = [];
    let currentFrom = from;

    while (currentFrom <= to) {
      const currentTo = Math.min(currentFrom + INTERNAL_BATCH - 1, to);

      const { data, error } = await supabaseAdmin
        .from("shopify_url_inventory")
        .select("url,last_modified")
        .eq("is_active", true)
        .eq("is_indexable", true)
        .order("id", { ascending: true }) // stable ordering
        .range(currentFrom, currentTo);

      if (error) {
        console.error("Supabase range error:", error.message);
        return new NextResponse("Supabase error", { status: 500 });
      }

      if (!data || data.length === 0) break;

      allRows = allRows.concat(data as any);

      // If Supabase returns fewer than requested, we’re at the end
      if (data.length < INTERNAL_BATCH) break;

      currentFrom += INTERNAL_BATCH;
    }

    const urls = allRows;

    // If chunk has no rows, return a valid empty sitemap
    if (urls.length === 0) {
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

      return new NextResponse(emptyXml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
        },
      });
    }

    // ----------------------------------------------------
    // Build XML
    // ----------------------------------------------------
    const xmlBody = urls
      .map((row) => {
        const lastmod = row.last_modified
          ? new Date(row.last_modified).toISOString().split("T")[0]
          : null;

        return `
  <url>
    <loc>${escapeXml(row.url)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
  </url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
      },
    });
  } catch (err: any) {
    console.error("Unexpected sitemap error:", err?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}