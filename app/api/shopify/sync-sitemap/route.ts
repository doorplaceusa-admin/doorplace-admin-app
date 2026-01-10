import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const res = await fetch("https://doorplaceusa.com/sitemap.xml");
    const xml = await res.text();

    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const urls = matches.map(m => m[1]);

    const pageUrls = urls.filter(u => u.includes("/pages/"));

    const rows = pageUrls.map(url => {
      const slug = url.split("/pages/")[1];
      return { slug, url };
    });

    const { error } = await supabaseAdmin
      .from("existing_shopify_pages")
      .upsert(rows, { onConflict: "slug" });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: rows.length
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
