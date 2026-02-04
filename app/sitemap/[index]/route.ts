import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CHUNK_SIZE = 50000;

export async function GET(
  req: Request,
  context: any
) {
  const index = parseInt(context.params.index);

  const from = index * CHUNK_SIZE;
  const to = from + CHUNK_SIZE - 1;

  const { data, error } = await supabaseAdmin
    .from("shopify_urls")
    .select("url")
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    return new NextResponse("Supabase error", { status: 500 });
  }

  const xmlUrls = (data || [])
    .map(
      (row) => `
  <url>
    <loc>${row.url}</loc>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
