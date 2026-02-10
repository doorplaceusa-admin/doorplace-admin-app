import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CHUNK_SIZE = 5000;
const BASE_URL = "https://doorplaceusa.com";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ index: string }> }
) {
  const { index } = await params;

  const indexNum = parseInt(index, 10);

  if (isNaN(indexNum) || indexNum < 0) {
    return new NextResponse("Invalid sitemap index", { status: 400 });
  }

  const from = indexNum * CHUNK_SIZE;
  const to = from + CHUNK_SIZE - 1;

  console.log(`🧭 Sitemap Chunk ${indexNum} (${from} → ${to})`);

  // ======================================================
  // ✅ Pull ONLY real, active, indexable Shopify pages
  // ======================================================
  const { data, error } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("path, last_modified")
    .eq("page_type", "page")
    .eq("is_active", true)
    .eq("is_indexable", true)
    .order("last_modified", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("❌ Supabase sitemap error:", error);
    return new NextResponse("Supabase error", { status: 500 });
  }

  const urls = data || [];

  if (urls.length === 0) {
    return new NextResponse("No URLs found", { status: 404 });
  }

  // ======================================================
  // ✅ Build XML Body
  // ======================================================
  const xmlBody = urls
    .map((row) => {
      const loc = `${BASE_URL}${row.path}`;
      const lastmod = row.last_modified
        ? new Date(row.last_modified).toISOString()
        : new Date().toISOString();

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("");

  // ======================================================
  // ✅ Full Sitemap XML
  // ======================================================
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "X-TradePilot-Sitemap": "shopify-url-inventory",
    },
  });
}

