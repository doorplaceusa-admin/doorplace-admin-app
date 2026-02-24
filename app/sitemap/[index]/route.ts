import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;

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
    // ----------------------------------------------------
    // Calculate row window (NOT offset)
    // ----------------------------------------------------
    const startRow = indexNum * CHUNK_SIZE + 1;
    const endRow = startRow + CHUNK_SIZE - 1;

    // ----------------------------------------------------
    // Call Supabase RPC (windowed query)
    // ----------------------------------------------------
    const { data, error } = await supabaseAdmin.rpc(
      "get_sitemap_chunk",
      {
        chunk_start: startRow,
        chunk_end: endRow,
      }
    );

    if (error) {
      console.error("Supabase RPC error:", error.message);
      return new NextResponse("Supabase error", { status: 500 });
    }

    const urls = data ?? [];

    // ----------------------------------------------------
    // If empty → return valid empty sitemap
    // ----------------------------------------------------
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
      .map((row: any) => {
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