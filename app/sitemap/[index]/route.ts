import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 50000;

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
    // 1️⃣ Fast total count (estimated)
    // ----------------------------------------------------
    const { count, error: countError } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("*", { count: "estimated", head: true })
      .eq("is_active", true)
      .eq("is_indexable", true);

    if (countError) {
      console.error("Supabase count error:", countError.message);
      return new NextResponse("Supabase error", { status: 500 });
    }

    const totalRows = count ?? 0;

    const from = indexNum * CHUNK_SIZE;
    let to = from + CHUNK_SIZE - 1;

    // ----------------------------------------------------
    // 2️⃣ Prevent overflow on final chunk
    // ----------------------------------------------------
    if (to >= totalRows) {
      to = totalRows - 1;
    }

    // If chunk is beyond dataset → return empty sitemap
    if (from >= totalRows || totalRows === 0) {
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

      return new NextResponse(emptyXml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      });
    }

    // ----------------------------------------------------
    // 3️⃣ Fetch chunk (ORDER BY ID = FAST + INDEXED)
    // ----------------------------------------------------
    const { data, error } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url,last_modified")
      .eq("is_active", true)
      .eq("is_indexable", true)
      .order("id", { ascending: true })   // 🔥 critical fix
      .range(from, to);

    if (error) {
      console.error("Supabase range error:", error.message);
      return new NextResponse("Supabase error", { status: 500 });
    }

    const urls = data ?? [];

    // ----------------------------------------------------
    // 4️⃣ Build XML
    // ----------------------------------------------------
    const xmlBody = urls
      .map((row) => {
        const lastmod = row.last_modified
          ? new Date(row.last_modified).toISOString().split("T")[0]
          : null;

        return `
  <url>
    <loc>${row.url}</loc>
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