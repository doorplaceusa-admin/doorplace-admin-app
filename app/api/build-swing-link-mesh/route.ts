export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* -------------------------------------------------- */
/* SLEEP (Shopify rate control)                        */
/* -------------------------------------------------- */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -------------------------------------------------- */
/* SHOPIFY FETCH                                       */
/* -------------------------------------------------- */

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

/* -------------------------------------------------- */
/* FORMAT TITLE                                        */
/* -------------------------------------------------- */

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/* -------------------------------------------------- */
/* EXTRACT HANDLE FROM URL                             */
/* -------------------------------------------------- */

function extractHandle(url: string) {

  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

/* -------------------------------------------------- */
/* DETECT TOPIC                                        */
/* -------------------------------------------------- */

function detectTopic(slug: string) {

  slug = slug.toLowerCase()

  if (slug.includes("cedar")) return "cedar"
  if (slug.includes("pine")) return "pine"
  if (slug.includes("oak")) return "oak"
  if (slug.includes("daybed")) return "daybed"
  if (slug.includes("farmhouse")) return "farmhouse"
  if (slug.includes("patio")) return "patio"
  if (slug.includes("garden")) return "garden"
  if (slug.includes("backyard")) return "backyard"
  if (slug.includes("front")) return "front"

  return "porch-swing"
}

/* -------------------------------------------------- */
/* GUIDE BLOCK                                         */
/* -------------------------------------------------- */

const GUIDE_BLOCK = `
<div class="tp-link-mesh" style="margin-top:45px; max-width:900px; margin-left:auto; margin-right:auto;">

<h2 style="color:#b80d0d;">
Porch Swing Guides
</h2>

<ul style="line-height:1.9;font-size:16px;">

<li>
<a href="https://doorplaceusa.com/pages/best-porch-swings" style="color:#b80d0d;">
Best Porch Swings
</a>
</li>

<li>
<a href="https://doorplaceusa.com/pages/porch-swing-ideas" style="color:#b80d0d;">
Porch Swing Ideas
</a>
</li>

<li>
<a href="https://doorplaceusa.com/pages/porch-swing-buying-guide" style="color:#b80d0d;">
Porch Swing Buying Guide
</a>
</li>

<li>
<a href="https://doorplaceusa.com/pages/porch-swing-maintenance" style="color:#b80d0d;">
Porch Swing Maintenance
</a>
</li>

<li>
<a href="https://doorplaceusa.com/pages/porch-swing-safety-guide" style="color:#b80d0d;">
Porch Swing Safety Guide
</a>
</li>

</ul>

</div>
`;

/* -------------------------------------------------- */
/* MAIN ROUTE                                          */
/* -------------------------------------------------- */

export async function POST() {

  console.log("=======================================");
  console.log("🚀 SUPABASE LINK MESH STARTED");
  console.log("=======================================");

  let processed = 0;
  let updated = 0;

  try {

    /* -------------------------------------------------- */
    /* GET POINTER                                        */
    /* -------------------------------------------------- */

    const { data: pointer } = await supabaseAdmin
      .from("internal_link_pointer")
      .select("*")
      .eq("id", 1)
      .single();

    const offset = pointer?.current_offset || 0;

    /* -------------------------------------------------- */
    /* GET SWING PAGES FROM INVENTORY                     */
    /* -------------------------------------------------- */

    const { data: pages } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", "%porch-swing%")
      .range(offset, offset + 249);

    if (!pages || pages.length === 0) {

      console.log("❌ No pages found");

      return NextResponse.json({
        success: true,
        message: "No pages returned",
      });
    }

    console.log(`Loaded ${pages.length} pages from inventory`);

    /* -------------------------------------------------- */
    /* PROCESS PAGES                                      */
    /* -------------------------------------------------- */

    for (const p of pages) {

      const handle = extractHandle(p.url);
      const topic = detectTopic(handle);

      processed++;

      /* -------------------------------------------------- */
      /* GET SHOPIFY PAGE                                   */
      /* -------------------------------------------------- */

      const res = await shopifyFetch(`/pages.json?handle=${handle}`);
      const data = await res.json();

      const page = data.pages?.[0];

      if (!page) {
        console.log(`⚠️ Page not found: ${handle}`);
        continue;
      }

      const html = (page.body_html || "").toLowerCase();

      if (
        html.includes("porch swing guides") ||
        html.includes("explore more porch swings")
      ) {
        continue;
      }

      /* -------------------------------------------------- */
      /* GET POINTER AGAIN                                  */
      /* -------------------------------------------------- */

      const { data: pointer2 } = await supabaseAdmin
        .from("internal_link_pointer")
        .select("*")
        .eq("id", 1)
        .single();

      const linkOffset = pointer2?.current_offset || 0;

      /* -------------------------------------------------- */
      /* GET DYNAMIC LINKS                                  */
      /* -------------------------------------------------- */

      const { data: urls } = await supabaseAdmin
        .from("shopify_url_inventory")
        .select("url")
        .ilike("url", `%${topic}%`)
        .range(linkOffset, linkOffset + 5);

      const urlsArr = urls ?? [];

      if (urlsArr.length === 0) continue;

      const dynamicLinks = `
<div style="margin-top:45px;">

<h2 style="color:#b80d0d;">
Explore More Porch Swings
</h2>

<ul style="line-height:1.9;font-size:16px;">

${urlsArr.map((u:any)=>{

const slug = extractHandle(u.url)

return `
<li>
<a href="https://doorplaceusa.com/pages/${slug}" style="color:#b80d0d;">
${formatTitle(slug)}
</a>
</li>
`

}).join("")}

</ul>

</div>
`;

      /* -------------------------------------------------- */
      /* INSERT BEFORE FOOTER                               */
      /* -------------------------------------------------- */

      let updatedHTML = page.body_html || "";

      const footerIndex = updatedHTML.toLowerCase().indexOf("</footer>");

      if (footerIndex !== -1) {
        updatedHTML =
          updatedHTML.slice(0, footerIndex) +
          GUIDE_BLOCK +
          dynamicLinks +
          updatedHTML.slice(footerIndex);
      } else {
        updatedHTML = updatedHTML + GUIDE_BLOCK + dynamicLinks;
      }

      /* -------------------------------------------------- */
      /* UPDATE SHOPIFY PAGE                                */
      /* -------------------------------------------------- */

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

      console.log(`✅ Updated ${handle}`);

      /* -------------------------------------------------- */
      /* MOVE POINTER                                       */
      /* -------------------------------------------------- */

      await supabaseAdmin
        .from("internal_link_pointer")
        .update({
          current_offset: linkOffset + 6,
        })
        .eq("id", 1);

      await sleep(350);
    }

    /* -------------------------------------------------- */
    /* MOVE MAIN POINTER                                  */
    /* -------------------------------------------------- */

    await supabaseAdmin
      .from("internal_link_pointer")
      .update({
        current_offset: offset + pages.length,
      })
      .eq("id", 1);

    console.log("=======================================");
    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log("=======================================");

    return NextResponse.json({
      success: true,
      processed,
      updated,
    });

  } catch (err:any) {

    console.error("❌ ERROR:", err.message);

    return NextResponse.json(
      {
        success:false,
        error:err.message
      },
      { status:500 }
    );
  }
}