import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {

    const { data, error } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url,last_modified")
      .eq("is_active", true)
      .eq("is_indexable", true)
      .order("url", { ascending: true })
      .limit(2500);

    if (error) {
      console.error(error);
      return new NextResponse("Database error", { status: 500 });
    }

    const urls = data
      .map((row) => {
        return `
<url>
<loc>https://doorplaceusa.com${row.url}</loc>
<lastmod>${row.last_modified}</lastmod>
</url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=600",
      },
    });

  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}