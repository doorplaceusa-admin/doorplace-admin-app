export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";
import { load } from "cheerio";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 5000;
const JITTER_MS = 1500;
const MAX_RETRIES = 5;
const BATCH_SIZE = 100;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function randomDelay() {
  return SHOPIFY_DELAY_MS + Math.floor(Math.random() * JITTER_MS);
}

async function safeShopifyFetch(path: string, options: RequestInit = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await shopifyLimiter();

      const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, {
        ...options,
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 429) {
        console.log(`⏳ Throttled (attempt ${attempt})`);
        await sleep(2000 * attempt);
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        console.log("❌ Shopify error:", txt);
        await sleep(1500 * attempt);
        continue;
      }

      return res;
    } catch (err) {
      console.log("⚠️ Network error:", err);
      await sleep(2000 * attempt);
    }
  }

  console.log("❌ Failed after retries:", path);
  return null; // NEVER throw → prevents crash
}

// helpers
function extractHandle(urlString: string) {
  return urlString?.split("/").pop()?.trim() || "";
}

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const GUIDE_BLOCK = `
<div class="tp-guide-block" style="margin-top:60px;border-top:1px solid #ddd;padding-top:30px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">
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
  console.log("🚀 STARTING SAFE ALL-DAY RUN");

  let offset = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  const { data: inventory } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .or("url.ilike.%swing%,url.ilike.%swings%");

  if (!inventory) {
    return NextResponse.json({ success: false, message: "No inventory found." });
  }

  const allPages = inventory.map((row) => ({
    slug: extractHandle(row.url),
  }));

  while (true) {
    const batch = inventory.slice(offset, offset + BATCH_SIZE);
    if (!batch.length) break;

    for (const row of batch) {
      try {
        const handle = extractHandle(row.url);
        if (!handle) continue;

        console.log("🔍 Processing:", handle);

        const findRes = await safeShopifyFetch(`/pages.json?handle=${handle}`);
        if (!findRes) continue;

        const findJson = await findRes.json();
        if (!findJson.pages?.length) continue;

        const page = findJson.pages[0];
        const pageId = page.id;
        let body = page.body_html || "";

        if (!body.includes("TP_LINK_MESH_START")) continue;

        // remove mesh
        body = body.replace(
          /<!-- TP_LINK_MESH_START -->[\s\S]*?<!-- TP_LINK_MESH_END -->/g,
          ""
        );

        const $ = load(body, null, false);
        $(".tp-guide-block").remove();

        // select links
        const filtered = allPages.filter((p) => p.slug !== handle);
        const selected: { slug: string }[] = [];

        while (selected.length < 3 && filtered.length > 0) {
          const index = Math.floor(Math.random() * filtered.length);
          selected.push(filtered.splice(index, 1)[0]);
        }

        const newBlock = `
<!-- TP_LINK_MESH_START -->
<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">
<h2 style="text-align:center">Related Porch Swing Options</h2>
<ul>
${selected.map(link => `
<li>
<a href="/pages/${link.slug}">
${formatTitle(link.slug)}
</a>
</li>`).join("")}
</ul>
</div>
${GUIDE_BLOCK}
<!-- TP_LINK_MESH_END -->
`;

        $.root().append(`\n${newBlock}`);

        const updateRes = await safeShopifyFetch(`/pages/${pageId}.json`, {
          method: "PUT",
          body: JSON.stringify({
            page: {
              id: pageId,
              body_html: $.html(),
            },
          }),
        });

        if (updateRes) {
          totalUpdated++;
          console.log(`✅ Updated: ${handle}`);
        } else {
          totalErrors++;
        }

        await sleep(randomDelay());

      } catch (err) {
        totalErrors++;
        console.log("❌ Page failed but continuing:", err);
        continue; // NEVER STOP LOOP
      }
    }

    offset += BATCH_SIZE;
  }

  console.log("🎯 DONE");
  console.log("✅ Updated:", totalUpdated);
  console.log("⚠️ Errors:", totalErrors);

  return NextResponse.json({
    success: true,
    updated: totalUpdated,
    errors: totalErrors,
  });
}