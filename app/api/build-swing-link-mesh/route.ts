export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2023-10";
const SHOPIFY_DELAY_MS = 4000;
const MAX_RETRIES = 10;
const BATCH_SIZE = 100;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function shopifyFetch(path: string, options: RequestInit = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await shopifyLimiter();

    const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, {
      ...options,
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 429) {
      console.log("⏳ Shopify throttle", attempt);
      await sleep(2000 * attempt);
      continue;
    }

    if (!res.ok) {
      const txt = await res.text();
      console.log("❌ Shopify error", txt);
      throw new Error(txt);
    }

    return res;
  }

  throw new Error("Shopify failed");
}

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

// ✅ Clean readable title
function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// ✅ KEEP YOUR GUIDE SECTION SAFE
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
  console.log("🧹 CLEANING + FIXING LINK MESH");

  let offset = 0;
  let totalUpdated = 0;

  const { data: inventory } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .or("url.ilike.%swing%,url.ilike.%swings%");

  if (!inventory) {
    return NextResponse.json({ success: false });
  }

  const allPages = inventory.map((row) => ({
    slug: extractHandle(row.url),
  }));

  while (true) {
    const batch = inventory.slice(offset, offset + BATCH_SIZE);
    if (!batch.length) break;

    for (const row of batch) {
      const handle = extractHandle(row.url);

      console.log("Checking:", handle);

      const findRes = await shopifyFetch(`/pages.json?handle=${handle}`);
      const findJson = await findRes.json();

      if (!findJson.pages || findJson.pages.length === 0) continue;

      const page = findJson.pages[0];
      const pageId = page.id;
      let body = page.body_html || "";

      // ✅ ONLY TOUCH pages that already have mesh
      if (!body.includes("TP_LINK_MESH_START")) {
        continue;
      }

      console.log("✂️ Cleaning page:", handle);

      // 🔥 Remove ONLY mesh block
      body = body.replace(
        /<!-- TP_LINK_MESH_START -->[\s\S]*?<!-- TP_LINK_MESH_END -->/g,
        ""
      );

      // Pick 3 random links (excluding itself)
      const filtered = allPages.filter((p) => p.slug !== handle);

      const selected = [];
      while (selected.length < 3 && filtered.length > 0) {
        const index = Math.floor(Math.random() * filtered.length);
        const pick = filtered.splice(index, 1)[0];
        selected.push(pick);
      }

      // ✅ NEW CLEAN BLOCK + GUIDES RESTORED
      const newBlock = `
<!-- TP_LINK_MESH_START -->

<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Related Porch Swing Options</h2>

<ul>
${selected
  .map(
    (link) => `
<li>
<a href="/pages/${link.slug}">
${formatTitle(link.slug)}
</a>
</li>`
  )
  .join("")}
</ul>

</div>

${GUIDE_BLOCK}

<!-- TP_LINK_MESH_END -->
`;

      const updatedBody = body + newBlock;

      await shopifyFetch(`/pages/${pageId}.json`, {
        method: "PUT",
        body: JSON.stringify({
         page: {
  body_html: updatedBody,
}
        }),
      });

      totalUpdated++;

      await sleep(SHOPIFY_DELAY_MS);
    }

    offset += BATCH_SIZE;
  }

  console.log("✅ DONE:", totalUpdated);

  return NextResponse.json({
    success: true,
    updated: totalUpdated,
  });
}