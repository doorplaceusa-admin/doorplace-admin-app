export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 650;
const COOLDOWN_MS = 60000;
const MAX_RETRIES = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      console.log("❌ Shopify API Error:", text);
      throw new Error(text);
    }

    return res;
  }

  throw new Error("Shopify request failed");
}

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/* ------------------------------------- */
/* GUIDE BLOCK */
/* ------------------------------------- */

const GUIDE_BLOCK = `
<div style="margin-top:60px;border-top:1px solid #ddd;padding-top:30px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Porch Swing Guides</h2>

<ul>
<li><a href="/pages/best-porch-swings">Best Porch Swings</a></li>
<li><a href="/pages/porch-swing-ideas">Porch Swing Ideas</a></li>
<li><a href="/pages/porch-swing-buying-guide">Porch Swing Buying Guide</a></li>
<li><a href="/pages/porch-swing-maintenance">Porch Swing Maintenance</a></li>
<li><a href="/pages/porch-swing-safety-guide">Porch Swing Safety Guide</a></li>
</ul>

</div>
`;

export async function POST() {

  console.log("🚀 BUILD SWING LINK MESH STARTED");

  let updated = 0;

  const { data: pointer } = await supabaseAdmin
    .from("internal_link_pointer")
    .select("*")
    .eq("id", 1)
    .single();

  const pageOffset = pointer?.current_offset || 0;

  console.log("📍 Current Offset:", pageOffset);

  const { data: pages } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .ilike("url", "%porch-swing%")
    .range(pageOffset, pageOffset + 249);

  console.log("📄 Pages Returned:", pages?.length);

  if (!pages || pages.length === 0) {
    console.log("⚠️ No pages returned — exiting route");
    return NextResponse.json({ success: true });
  }

  for (let i = 0; i < pages.length; i++) {

    const url = pages[i].url as string;
    const handle = extractHandle(url);

    console.log(`🔧 Processing Page ${i + 1}:`, handle);

    const res = await shopifyFetch(`/pages.json?handle=${handle}`);
    const data = await res.json();

    const page = data.pages?.[0];

    if (!page) {
      console.log("⚠️ Page not found in Shopify:", handle);
      continue;
    }

    const html = (page.body_html || "").toLowerCase();

    if (html.includes("porch swing guides")) {
      console.log("⏭ Skipping (already updated):", handle);
      continue;
    }

    /* ---------------------------------- */
    /* DYNAMIC LINKS */
    /* ---------------------------------- */

    const start = (pageOffset + i) * 5;

    console.log("🔗 Dynamic Link Range:", start, "-", start + 4);

    const { data: urls } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", "%porch-swing%")
      .range(start, start + 4);

    if (!urls || urls.length === 0) {
      console.log("⚠️ No dynamic links found for:", handle);
      continue;
    }

    const dynamicLinks = `
<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Explore More Porch Swings</h2>

<ul>
${urls.map((u: any) => {

  const slug = extractHandle(u.url);

  return `<li><a href="/pages/${slug}">${formatTitle(slug)}</a></li>`;

}).join("")}

</ul>

</div>
`;

    const updatedHTML =
      (page.body_html || "") +
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

    console.log("✅ Updated:", handle);

    updated++;

    await sleep(SHOPIFY_DELAY_MS);
  }

  const newOffset = pageOffset + pages.length;

  await supabaseAdmin
    .from("internal_link_pointer")
    .update({
      current_offset: newOffset,
    })
    .eq("id", 1);

  console.log("📍 Pointer Updated To:", newOffset);
  console.log("🎉 Total Pages Updated:", updated);

  return NextResponse.json({
    success: true,
    updated
  });
}