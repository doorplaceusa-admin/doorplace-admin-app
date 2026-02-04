import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CHUNK_SIZE = 50000;

export async function GET(
  request: Request,
  context: { params: { index: string } }
) {
  const indexNum = parseInt(context.params.index, 10);

  if (isNaN(indexNum)) {
    return new NextResponse("Invalid sitemap index", { status: 400 });
  }

  const from = indexNum * CHUNK_SIZE;
  const to = from + CHUNK_SIZE - 1;

  const { data, error } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .order("url", { ascending: true })
    .range(from, to);

  if (error) {
    return new NextResponse("Supabase error", { status: 500 });
  }

  const urls = data || [];

  const xmlBody = urls
    .map(
      (row) => `
  <url>
    <loc>${row.url}</loc>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
