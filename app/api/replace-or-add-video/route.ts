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

/* =========================
   🔥 FIXED SHOPIFY FETCH
========================= */
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
      console.warn(`⚠️ Rate limited. Retrying in ${2 * attempt}s...`);
      await sleep(2000 * attempt);
      continue;
    }

    if (!res.ok) {
      const txt = await res.text();

      // ✅ IGNORE HANDLE ERROR (KEY FIX)
      if (txt.includes("handle") && txt.includes("taken")) {
        console.warn("⚠️ Handle already exists. Skipping safely...");
        return null;
      }

      console.error("❌ Shopify error:", txt);

      if (attempt < MAX_RETRIES) {
        console.warn(`🔁 Retrying (${attempt}/${MAX_RETRIES})...`);
        await sleep(1000 * attempt);
        continue;
      }

      console.warn("⚠️ Skipping after max retries...");
      return null;
    }

    return res;
  }

  console.warn("⚠️ Shopify request failed after retries — skipping.");
  return null;
}

/* =========================
   🚀 MAIN PROCESS
========================= */
export async function POST() {
  console.log("🔥 MASTER CLEAN + VIDEO FIX STARTED");

  let pageInfo: string | null = null;
  let totalUpdated = 0;
  let pageCount = 0;

  while (true) {
    console.log(`\n📦 Fetching pages... ${pageInfo ? "(Next Page)" : "(Page 1)"}`);

    const res = await shopifyFetch(
      `/pages.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ""}`
    );

    if (!res) {
      console.log("⚠️ Skipping this batch due to fetch error...");
      continue;
    }

    const json = await res.json();
    const pages = json.pages || [];

    if (!pages.length) {
      console.log("🏁 No more pages.");
      break;
    }

    for (const p of pages) {
      pageCount++;
      const originalBody = p.body_html || "";
      let body = originalBody;

      if (
        !body.includes("Automatic Barn Door Opener") &&
        !body.includes("SlideDrive™")
      ) {
        continue;
      }

      console.log(`\n🛠️ --- PROCESSING: ${p.handle} ---`);

      /* =========================
         STEP 0: CLEAN TEXT
      ========================= */
      body = body.replace(/["']?\s*type=["']?video\/mp4["']?[\s>]*>?/gi, "");
      body = body.replace(/"\s*&gt;/gi, "");

      if (body !== originalBody) {
        console.log("   🧹 Cleaned garbage text");
      }

      const $ = load(body, null, false);
      const preLen = $.html().length;

      /* =========================
         STEP 1: REMOVE OLD VIDEO
      ========================= */
      $("video").remove();
      $('source[type="video/mp4"]').remove();
      $(`[src*="${TARGET_VIDEO}"]`).remove();

      let removedIframe = false;
      $("iframe").each((_, el) => {
        const src = $(el).attr("src") || "";
        if (!src.includes("RGSK62chHlY")) {
          $(el).remove();
          removedIframe = true;
        }
      });

      if ($.html().length !== preLen || removedIframe) {
        console.log("   🗑️ Removed old videos");
      }

      /* =========================
         STEP 2: FIX NESTED BOXES
      ========================= */
      let fixedNested = false;
      $(".dp-media-box > .dp-media-box").each((_, el) => {
        $(el).removeClass("dp-media-box").addClass("dp-media-box-inner");
        fixedNested = true;
      });

      if (fixedNested) {
        console.log("   🔧 Fixed nested media boxes");
      }

      /* =========================
         STEP 3: INSERT VIDEO
      ========================= */
      const currentHtml = $.html();

      if (!currentHtml.includes("youtube.com/embed/RGSK62chHlY")) {
        const firstBox = $(".dp-media-box").first();

        if (firstBox.length > 0) {
          firstBox.prepend(YOUTUBE_VIDEO_BLOCK);
          console.log("   🎯 Inserted YouTube video");
        } else {
          $.root().prepend(YOUTUBE_VIDEO_BLOCK);
          console.log("   ⬆️ Inserted video at top");
        }
      } else {
        console.log("   ✅ Video already exists");
      }

      const finalHtml = $.html();

      /* =========================
         UPDATE PAGE
      ========================= */
      if (finalHtml !== originalBody) {
        console.log("   🚀 Updating Shopify...");

        const updateRes = await shopifyFetch(`/pages/${p.id}.json`, {
          method: "PUT",
          body: JSON.stringify({
            page: {
              id: p.id,
              body_html: finalHtml,
            },
          }),
        });

        if (!updateRes) {
          console.log("   ⚠️ Update skipped due to Shopify error");
          continue;
        }

        totalUpdated++;
        console.log(`   ✅ Updated (${totalUpdated})`);

        await sleep(SHOPIFY_DELAY_MS);
      } else {
        console.log("   🤷 No changes");
      }
    }

    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    pageInfo = match ? match[1] : null;

    if (!pageInfo) break;
  }

  console.log(`\n🎉 DONE`);
  console.log(`📊 Scanned: ${pageCount}`);
  console.log(`✅ Updated: ${totalUpdated}`);

  return NextResponse.json({
    success: true,
    scanned: pageCount,
    updated: totalUpdated,
  });
}