export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";
import { load } from "cheerio";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2023-10";

const SHOPIFY_DELAY_MS = 4000;
const MAX_RETRIES = 10;

const TARGET_VIDEO =
  "https://cdn.shopify.com/videos/c/o/v/cd3df8d6c9324b0ab1b66f84b35d7203.mov";

const YOUTUBE_VIDEO_BLOCK = `
<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin-bottom:20px;">
  <iframe src="https://www.youtube.com/embed/RGSK62chHlY?rel=0&modestbranding=1&playsinline=1"
  frameborder="0"
  allow="encrypted-media"
  allowfullscreen
  style="position:absolute;top:0;left:0;width:100%;height:100%;">
  </iframe>
</div>
`;

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
      console.warn(`⚠️ Rate limited by Shopify. Retrying in ${2 * attempt}s...`);
      await sleep(2000 * attempt);
      continue;
    }

    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ Shopify error:", txt);
      throw new Error(txt);
    }

    return res;
  }

  throw new Error("Shopify request failed after max retries.");
}

export async function POST() {
  console.log("🔥 MASTER CLEAN + VIDEO FIX STARTED");

  let pageInfo: string | null = null;
  let totalUpdated = 0;
  let pageCount = 0;

  while (true) {
    console.log(`\n📦 Fetching batch of pages from Shopify... ${pageInfo ? "(Next Page)" : "(Page 1)"}`);
    
    const res = await shopifyFetch(
      `/pages.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ""}`
    );

    const json = await res.json();
    const pages = json.pages || [];

    if (!pages.length) {
      console.log("🏁 No more pages found in this batch.");
      break;
    }

    for (const p of pages) {
      pageCount++;
      const originalBody = p.body_html || "";
      let body = originalBody;

      // Only target specific pages
      if (
        !body.includes("Automatic Barn Door Opener") &&
        !body.includes("SlideDrive™")
      ) {
        // Silently continue to prevent console spam for unrelated pages
        continue;
      }

      console.log(`\n🛠️ --- PROCESSING PAGE: ${p.handle} ---`);

      // =========================
      // 🔥 STEP 0: PRE-CLEAN MALFORMED TEXT
      // =========================
      body = body.replace(/["']?\s*type=["']?video\/mp4["']?[\s>]*>?/gi, "");
      body = body.replace(/"\s*&gt;/gi, "");
      
      if (body !== originalBody) {
        console.log("   🧹 Cleaned up floating garbage text/quotes");
      }

      const $ = load(body, null, false);
      const preCleanupHtmlLength = $.html().length;

      // =========================
      // 🔥 STEP 1: DOM CLEANUP
      // =========================
      $('video').remove();
      $('source[type="video/mp4"]').remove();
      $(`[src*="${TARGET_VIDEO}"]`).remove();

      let removedIframe = false;
      $('iframe').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (!src.includes('RGSK62chHlY')) {
          $(el).remove();
          removedIframe = true;
        }
      });

      if ($.html().length !== preCleanupHtmlLength || removedIframe) {
        console.log("   🗑️ Removed old native video tags / iframes");
      }

      // =========================
      // 🔥 STEP 2: FIX NESTED MEDIA BOXES
      // =========================
      let fixedNestedBoxes = false;
      $('.dp-media-box > .dp-media-box').each((_, el) => {
        $(el).removeClass('dp-media-box').addClass('dp-media-box-inner');
        fixedNestedBoxes = true;
      });

      if (fixedNestedBoxes) {
        console.log("   🔧 Fixed nested .dp-media-box classes");
      }

      // =========================
      // 🎯 STEP 3: INSERT VIDEO PROPERLY
      // =========================
      const currentHtml = $.html();
      
      if (!currentHtml.includes("youtube.com/embed/RGSK62chHlY")) {
        const firstMediaBox = $('.dp-media-box').first();

        if (firstMediaBox.length > 0) {
          firstMediaBox.prepend(YOUTUBE_VIDEO_BLOCK);
          console.log("   🎯 Inserted YouTube video inside media box");
        } else {
          $.root().prepend(YOUTUBE_VIDEO_BLOCK);
          console.log("   ⬆️ Inserted YouTube video at top of page (No media box found)");
        }
      } else {
        console.log("   ✅ YouTube video already exists on this page");
      }

      const finalHtml = $.html();

      // =========================
      // ✅ UPDATE PAGE IF CHANGED
      // =========================
      if (finalHtml !== originalBody) {
        console.log("   🚀 Changes detected. Pushing update to Shopify...");
        
        await shopifyFetch(`/pages/${p.id}.json`, {
          method: "PUT",
          body: JSON.stringify({
            page: {
              id: p.id,
              body_html: finalHtml,
            },
          }),
        });

        totalUpdated++;
        console.log(`   ✅ Page update successful! (Total updated so far: ${totalUpdated})`);
        await sleep(SHOPIFY_DELAY_MS);
      } else {
        console.log("   🤷 No changes required. Skipping Shopify PUT request.");
      }
    }

    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    pageInfo = match ? match[1] : null;

    if (!pageInfo) break;
  }

  console.log(`\n🎉 MASTER CLEANUP COMPLETE!`);
  console.log(`📊 Scanned ${pageCount} total pages.`);
  console.log(`✅ Successfully updated ${totalUpdated} pages.`);

  return NextResponse.json({
    success: true,
    scanned: pageCount,
    updated: totalUpdated,
  });
}