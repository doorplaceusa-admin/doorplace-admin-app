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
   SAFE SHOPIFY FETCH (ENTERPRISE)
====================================================== */

async function shopifyFetch(path: string, options: RequestInit = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {

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

    } catch (err) {

      if (attempt === MAX_RETRIES) {
        throw err;
      }

      await sleep(2000);
    }
  }
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

function parseLocationParts(slug: string) {
  const parts = slug.toLowerCase().split("-");

  const stateCode = parts[parts.length - 1];
  const cityPart = parts.slice(0, parts.length - 1).join("-");

  return { cityPart, stateCode };
}

function detectTopic(slug: string) {

  const s = slug.toLowerCase();

  if (s.includes("white-oak")) return "white-oak";
  if (s.includes("red-oak")) return "red-oak";
  if (s.includes("oak")) return "oak";
  if (s.includes("cedar")) return "cedar";
  if (s.includes("pine")) return "pine";

  if (s.includes("daybed")) return "daybed";
  if (s.includes("farmhouse")) return "farmhouse";
  if (s.includes("patio")) return "patio";
  if (s.includes("garden")) return "garden";
  if (s.includes("backyard")) return "backyard";

  return "porch-swing";
}

function buildTopicPool(topic: string) {

  const map: Record<string, string[]> = {

    cedar: ["cedar","outdoor","custom","porch-swing"],
    pine: ["pine","custom","porch-swing"],
    oak: ["oak","red-oak","white-oak","solid-wood","custom","porch-swing"],

    daybed: ["daybed","bed-swing","porch-bed","custom","porch-swing"],

    patio: ["patio","outdoor","garden","backyard","porch-swing"],
    garden: ["garden","patio","backyard","outdoor","porch-swing"],
    backyard: ["backyard","garden","patio","outdoor","porch-swing"],

    "porch-swing": ["porch-swing","custom","outdoor"],
  };

  return map[topic] || ["porch-swing","custom","outdoor"];
}

function dedupeUrls(urls: string[]) {
  return [...new Set(urls)];
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
   RELATED URL ENGINE
====================================================== */

async function getRelatedUrlsForSlug(currentUrl: string, limit = 6) {

  const handle = extractHandle(currentUrl);

  const topic = detectTopic(handle);

  const topicPool = buildTopicPool(topic);

  const { cityPart, stateCode } = parseLocationParts(handle);

  const collected: string[] = [];

  for (const topicTerm of topicPool) {

    if (collected.length >= limit) break;

    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", `%${topicTerm}%`)
      .ilike("url", `%${stateCode}`)
      .neq("url", currentUrl)
      .limit(12);

    for (const row of data || []) {

      const url = row.url as string;

      if (!collected.includes(url)) collected.push(url);

      if (collected.length >= limit) break;
    }
  }

  if (collected.length < limit && cityPart) {

    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", `%${cityPart}%`)
      .neq("url", currentUrl)
      .limit(20);

    for (const row of data || []) {

      const url = row.url as string;

      if (!collected.includes(url)) collected.push(url);

      if (collected.length >= limit) break;
    }
  }

  if (collected.length < limit) {

    const { data: pointer } = await supabaseAdmin
      .from("internal_link_pointer")
      .select("*")
      .eq("id",1)
      .single();

    const linkOffset = pointer?.link_pointer || 0;

    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .neq("url", currentUrl)
      .range(linkOffset, linkOffset + 24);

    for (const row of data || []) {

      const url = row.url as string;

      if (!collected.includes(url)) collected.push(url);

      if (collected.length >= limit) break;
    }
  }

  return dedupeUrls(collected).slice(0,limit);
}

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

      const res = (await shopifyFetch(`/pages.json?handle=${handle}`))!;

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

      const relatedUrls = await getRelatedUrlsForSlug(currentUrl,6);

      if (!relatedUrls.length) continue;

      const dynamicLinks = `
<h2>Explore More Porch Swings</h2>
<ul>
${relatedUrls.map(url => {

const slug = extractHandle(url);

return `<li><a href="/pages/${slug}">${formatTitle(slug)}</a></li>`;

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

      const { data:pointer2 } = await supabaseAdmin
        .from("internal_link_pointer")
        .select("*")
        .eq("id",1)
        .single();

      const nextLinkOffset = pointer2?.link_pointer || 0;

      await supabaseAdmin
        .from("internal_link_pointer")
        .update({
          link_pointer: nextLinkOffset + 6
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