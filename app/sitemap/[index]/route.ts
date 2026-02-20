import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 50000; // Google max

export async function GET(
  req: Request,
  { params }: { params: { index: string } }
) {
  try {
    const indexNum = parseInt(params.index, 10);

    if (isNaN(indexNum) || indexNum < 0) {
      return new NextResponse("Invalid sitemap index", { status: 400 });
    }

    const from = indexNum * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;

    console.log(`📂 Generating sitemap chunk ${indexNum}`);
    console.log(`📦 Range: ${from} → ${to}`);

    const { data, error } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url,last_modified")
      .eq("page_type", "page")
      .eq("is_active", true)
      .eq("is_indexable", true)
      .order("url", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("❌ Supabase error:", error);
      return new NextResponse("Supabase error", { status: 500 });
    }

    const urls = data || [];

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
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err) {
    console.error("❌ Sitemap chunk generation error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}