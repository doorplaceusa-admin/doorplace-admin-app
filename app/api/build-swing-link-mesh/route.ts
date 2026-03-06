export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shopifyFetch(path: string, options: RequestInit = {}) {

  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Shopify error ${res.status}`, text);
    throw new Error(text);
  }

  return res;
}

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const GUIDE_BLOCK = `
<div style="margin-top:45px;">

<h2 style="color:#b80d0d;">
Porch Swing Guides
</h2>

<ul style="line-height:1.9;font-size:16px;">

<li><a href="https://doorplaceusa.com/pages/best-porch-swings" style="color:#b80d0d;">Best Porch Swings</a></li>

<li><a href="https://doorplaceusa.com/pages/porch-swing-ideas" style="color:#b80d0d;">Porch Swing Ideas</a></li>

<li><a href="https://doorplaceusa.com/pages/porch-swing-buying-guide" style="color:#b80d0d;">Porch Swing Buying Guide</a></li>

<li><a href="https://doorplaceusa.com/pages/porch-swing-maintenance" style="color:#b80d0d;">Porch Swing Maintenance</a></li>

<li><a href="https://doorplaceusa.com/pages/porch-swing-safety-guide" style="color:#b80d0d;">Porch Swing Safety Guide</a></li>

</ul>

</div>
`;

export async function POST() {

  console.log("=======================================");
  console.log("🚀 SWING LINK MESH BUILDER STARTED");
  console.log("=======================================");

  let scanned = 0;
  let swingPages = 0;
  let updated = 0;

  let batch = 0;
  let nextPageInfo: string | null = null;

  try {

    do {

      batch++;

      const res = await shopifyFetch(
        `/pages.json?limit=20${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
      );

      const data = await res.json();
      const pages = data.pages || [];

      console.log(`📦 Batch #${batch} | pages=${pages.length}`);

      for (const page of pages) {

        scanned++;

        const html = (page.body_html || "").toLowerCase();
        const handle = (page.handle || "").toLowerCase();

        const hasResources = html.includes("helpful resources");
        const isSwingPage = handle.includes("swing");

        if (!hasResources || !isSwingPage) continue;

        swingPages++;

        if (html.includes("explore more porch swings")) continue;

        /* ---------------------------------- */
        /* Get pointer                        */
        /* ---------------------------------- */

        const { data: pointer } = await supabaseAdmin
          .from("internal_link_pointer")
          .select("*")
          .eq("id", 1)
          .single();

        const offset = pointer?.current_offset || 0;

        /* ---------------------------------- */
        /* Pull 6 URLs                        */
        /* ---------------------------------- */

        const { data: urls } = await supabaseAdmin
          .from("shopify_url_inventory")
          .select("slug")
          .order("slug")
          .range(offset, offset + 5);

        if (!urls || urls.length === 0) continue;

        const dynamicLinks = `
<div style="margin-top:45px;">

<h2 style="color:#b80d0d;">
Explore More Porch Swings
</h2>

<ul style="line-height:1.9;font-size:16px;">
${urls
  .map(
    (u: any) => `
<li>
<a href="https://doorplaceusa.com/pages/${u.slug}" style="color:#b80d0d;">
${formatTitle(u.slug)}
</a>
</li>`
  )
  .join("")}
</ul>

</div>
`;

        const updatedHTML =
          page.body_html +
          GUIDE_BLOCK +
          dynamicLinks;

        await shopifyFetch(`/pages/${page.id}.json`, {
          method: "PUT",
          body: JSON.stringify({
            page: {
              id: page.id,
              body_html: updatedHTML,
            },
          }),
        });

        updated++;

        await supabaseAdmin
          .from("internal_link_pointer")
          .update({
            current_offset: offset + 6,
          })
          .eq("id", 1);

        console.log(`✅ Updated page ${page.id}`);

        await sleep(350);
      }

      const link = res.headers.get("link");
      const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
      nextPageInfo = match ? match[1] : null;

      console.log(
        `📊 Progress | scanned=${scanned} swing_pages=${swingPages} updated=${updated}`
      );

    } while (nextPageInfo);

    console.log("=======================================");
    console.log("🎉 LINK MESH COMPLETE");
    console.log(`Pages scanned: ${scanned}`);
    console.log(`Swing pages found: ${swingPages}`);
    console.log(`Pages updated: ${updated}`);
    console.log("=======================================");

    return NextResponse.json({
      success: true,
      scanned,
      swing_pages_found: swingPages,
      pages_updated: updated,
    });

  } catch (err: any) {

    console.error("=======================================");
    console.error("❌ ERROR", err.message);
    console.error("=======================================");

    return NextResponse.json(
      {
        success: false,
        scanned,
        swing_pages_found: swingPages,
        pages_updated: updated,
        error: err.message,
      },
      { status: 500 }
    );
  }
}