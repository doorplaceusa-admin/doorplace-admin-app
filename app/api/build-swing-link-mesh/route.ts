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

/* ---------------------------------- */
/* GUIDE BLOCK                         */
/* ---------------------------------- */

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

/* ---------------------------------- */
/* MAIN ROUTE                          */
/* ---------------------------------- */

export async function POST() {

  console.log("==================================");
  console.log("🚀 SUPABASE LINK MESH STARTED");
  console.log("==================================");

  let processed = 0;
  let updated = 0;

  try {

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
    /* Get swing pages from inventory     */
    /* ---------------------------------- */

    const { data: pages } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("slug")
      .ilike("slug", "%porch-swing%")
      .range(offset, offset + 249);

    if (!pages || pages.length === 0) {

      console.log("No pages found");

      return NextResponse.json({
        success: true,
        message: "No pages returned",
      });
    }

    console.log(`Loaded ${pages.length} pages from inventory`);

    for (const p of pages) {

      processed++;

      const slug = p.slug;

      /* ---------------------------------- */
      /* Get Shopify page                   */
      /* ---------------------------------- */

      const res = await shopifyFetch(`/pages.json?handle=${slug}`);
      const data = await res.json();

      const page = data.pages?.[0];

      if (!page) continue;

      const html = (page.body_html || "").toLowerCase();

      if (html.includes("explore more porch swings")) {
        continue;
      }

      /* ---------------------------------- */
      /* Get dynamic URLs                   */
      /* ---------------------------------- */

      const { data: urls } = await supabaseAdmin
        .from("shopify_url_inventory")
        .select("slug")
        .order("slug")
        .range(offset, offset + 5);

      if (!urls) continue;

      const dynamicLinks = `
<div style="margin-top:45px;">

<h2 style="color:#b80d0d;">
Explore More Porch Swings
</h2>

<ul style="line-height:1.9;font-size:16px;">

${urls.map((u:any)=>`
<li>
<a href="https://doorplaceusa.com/pages/${u.slug}" style="color:#b80d0d;">
${formatTitle(u.slug)}
</a>
</li>
`).join("")}

</ul>

</div>
`;

      const updatedHTML = page.body_html + GUIDE_BLOCK + dynamicLinks;

      /* ---------------------------------- */
      /* Update page                        */
      /* ---------------------------------- */

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

      console.log(`✅ Updated ${slug}`);

      await sleep(600);
    }

    /* ---------------------------------- */
    /* Move pointer                       */
    /* ---------------------------------- */

    await supabaseAdmin
      .from("internal_link_pointer")
      .update({
        current_offset: offset + pages.length,
      })
      .eq("id", 1);

    console.log("==================================");
    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log("==================================");

    return NextResponse.json({
      success: true,
      processed,
      updated,
    });

  } catch (err:any) {

    console.error(err);

    return NextResponse.json(
      {
        success:false,
        error:err.message
      },
      { status:500 }
    );
  }
}