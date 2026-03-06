export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* ======================================================
   RATE CONTROL
====================================================== */

const SHOPIFY_DELAY_MS = 650;
const COOLDOWN_MS = 60000;
const MAX_RETRIES = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ======================================================
   SAFE SHOPIFY FETCH
====================================================== */

async function shopifyFetch(path: string, options: RequestInit = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `https://${SHOP}/admin/api/${API_VERSION}${path}`,
      {
        ...options,
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 429) {
      console.log(`⏳ Shopify throttled… retrying (${attempt}/${MAX_RETRIES})`);
      await sleep(2000 * attempt);

      if (attempt >= 6) {
        console.log("🛑 Cooldown wall triggered… sleeping 60s");
        await sleep(COOLDOWN_MS);
      }

      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Shopify error ${res.status}`, text);
      throw new Error(text);
    }

    return res;
  }

  throw new Error("Shopify request failed after retries");
}

/* ======================================================
   HELPERS
====================================================== */

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

/* ======================================================
   GUIDE BLOCK
====================================================== */

const GUIDE_BLOCK = `
<div style="margin-top:40px">
<h2>Porch Swing Guides</h2>
<ul>
<li><a href="/pages/best-porch-swings">Best Porch Swings</a></li>
<li><a href="/pages/porch-swing-ideas">Porch Swing Ideas</a></li>
<li><a href="/pages/porch-swing-buying-guide">Porch Swing Buying Guide</a></li>
<li><a href="/pages/porch-swing-maintenance">Porch Swing Maintenance</a></li>
<li><a href="/pages/porch-swing-safety-guide">Porch Swing Safety Guide</a></li>
</ul>
</div>
`;

/* ======================================================
   MAIN ROUTE
====================================================== */

export async function POST() {

  console.log("🚀 BUILD SWING LINK MESH STARTED");

  let processed = 0;
  let updated = 0;

  try {

    const { data: pointer } = await supabaseAdmin
      .from("internal_link_pointer")
      .select("*")
      .eq("id",1)
      .single();

    const pageOffset = pointer?.page_pointer || 0;

    const { data: pages } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url","%porch-swing%")
      .range(pageOffset,pageOffset+249);

    if (!pages || pages.length === 0) {

      console.log("No pages found");

      return NextResponse.json({
        success:true
      });
    }

    for (const p of pages) {

      const currentUrl = p.url as string;

      const handle = extractHandle(currentUrl);

      processed++;

      const res = await shopifyFetch(`/pages.json?handle=${handle}`);
      const data = await res.json();

      const page = data.pages?.[0];

      if (!page) {
        console.log(`Page not found: ${handle}`);
        continue;
      }

      const html = (page.body_html || "").toLowerCase();

      if (
        html.includes("porch swing guides") ||
        html.includes("explore more porch swings")
      ) {
        continue;
      }

      const { data:pointer2 } = await supabaseAdmin
        .from("internal_link_pointer")
        .select("*")
        .eq("id",1)
        .single();

      const linkOffset = pointer2?.link_pointer || 0;

      const { data: urls } = await supabaseAdmin
        .from("shopify_url_inventory")
        .select("url")
        .range(linkOffset, linkOffset + 5);

      if (!urls || urls.length === 0) continue;

      const dynamicLinks = `
<h2>Explore More Porch Swings</h2>
<ul>
${urls.map((u:any)=>{
const slug = extractHandle(u.url)
return `<li><a href="/pages/${slug}">${formatTitle(slug)}</a></li>`
}).join("")}
</ul>
`;

      const updatedHTML = (page.body_html || "") + GUIDE_BLOCK + dynamicLinks;

      await shopifyFetch(`/pages/${page.id}.json`,{
        method:"PUT",
        body:JSON.stringify({
          page:{
            id:page.id,
            body_html:updatedHTML
          }
        })
      });

      updated++;

      await supabaseAdmin
        .from("internal_link_pointer")
        .update({
          link_pointer: linkOffset + 6
        })
        .eq("id",1);

      await sleep(SHOPIFY_DELAY_MS);
    }

    await supabaseAdmin
      .from("internal_link_pointer")
      .update({
        page_pointer: pageOffset + pages.length
      })
      .eq("id",1);

    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);

    return NextResponse.json({
      success:true,
      processed,
      updated
    });

  } catch(err:any) {

    console.error("ERROR:",err.message);

    return NextResponse.json({
      success:false,
      error:err.message
    },{status:500});
  }
}