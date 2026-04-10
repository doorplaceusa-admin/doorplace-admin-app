export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";
// ✅ Correct modern Cheerio import
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

export async function POST() {
  console.log("🔥 MASTER CLEAN + VIDEO FIX STARTED");

  let pageInfo: string | null = null;
  let totalUpdated = 0;

  while (true) {
    const res = await shopifyFetch(
      `/pages.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ""}`
    );

    const json = await res.json();
    const pages = json.pages || [];

    if (!pages.length) break;

    for (const p of pages) {
      let body = p.body_html || "";

      // Only target specific pages
      if (
        !body.includes("Automatic Barn Door Opener") &&
        !body.includes("SlideDrive™")
      ) continue;

      // ✅ Load HTML into Cheerio correctly (null, false ensures it doesn't wrap it in <html><body> tags)
      const $ = load(body, null, false);

      // =========================
      // 🔥 STEP 1: DOM CLEANUP (No Regex)
      // =========================
      
      // Remove all native video tags
      $('video').remove();
      
      // Remove loose source tags referencing video
      $('source[type="video/mp4"]').remove();
      
      // Remove elements that specifically contain the old TARGET_VIDEO
      $(`[src*="${TARGET_VIDEO}"]`).remove();

      // Remove ALL iframes EXCEPT our new YouTube video
      $('iframe').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (!src.includes('RGSK62chHlY')) {
          $(el).remove();
        }
      });

      // =========================
      // 🔥 STEP 2: FIX NESTED MEDIA BOXES
      // =========================
      // Target any .dp-media-box that is a direct child of another .dp-media-box.
      // Swap its class so it doesn't double-apply styles, keeping HTML layout intact.
      $('.dp-media-box > .dp-media-box').each((_, el) => {
        $(el).removeClass('dp-media-box').addClass('dp-media-box-inner');
      });

      // =========================
      // 🎯 STEP 3: INSERT VIDEO PROPERLY
      // =========================
      const currentHtml = $.html();
      
      if (!currentHtml.includes("youtube.com/embed/RGSK62chHlY")) {
        const firstMediaBox = $('.dp-media-box').first();

        if (firstMediaBox.length > 0) {
          // Prepend inside the top of the media box
          firstMediaBox.prepend(YOUTUBE_VIDEO_BLOCK);
          console.log("🎯 Inserted video:", p.handle);
        } else {
          // Fallback: prepend to the very top of the page body
          $.root().prepend(YOUTUBE_VIDEO_BLOCK);
          console.log("⬆️ Inserted at top:", p.handle);
        }
      }

      // Extract the finalized DOM back to an HTML string
      const finalHtml = $.html();

      // =========================
      // ✅ UPDATE PAGE IF CHANGED
      // =========================
      if (finalHtml !== body) {
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
        await sleep(SHOPIFY_DELAY_MS);
      }
    }

    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    pageInfo = match ? match[1] : null;

    if (!pageInfo) break;
  }

  console.log("✅ DONE:", totalUpdated);

  return NextResponse.json({
    success: true,
    updated: totalUpdated,
  });
}