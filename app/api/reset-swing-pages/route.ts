import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!;

async function getPage(id: string) {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/pages/${id}.json`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  const json = await res.json();
  return json.page;
}

async function updatePage(id: string, body_html: string) {
  await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/pages/${id}.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: {
          id,
          body_html,
        },
      }),
    }
  );
}

export async function POST() {
  try {

    console.log("🧹 RESET SWING PAGES STARTED");

    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("shopify_page_id, handle")
      .limit(400);

    let cleaned = 0;

    for (const row of data || []) {

      const page = await getPage(row.shopify_page_id);
      if (!page?.body_html) continue;

      let html = page.body_html;

      if (!html.includes("Porch Swing Guides")) continue;

      const start = html.indexOf("Porch Swing Guides");
      const end = html.indexOf("Get a Fast Quote");

      if (start === -1 || end === -1) continue;

      const before = html.substring(0, start);
      const after = html.substring(end);

      const cleanedHTML = before + after;

      await updatePage(row.shopify_page_id, cleanedHTML);

      cleaned++;

      console.log("🧹 Cleaned:", row.handle);
    }

    return NextResponse.json({
      success: true,
      cleaned,
    });

  } catch (err: any) {

    console.error("❌ ERROR:", err.message);

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}