export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2023-10";

const SHOPIFY_DELAY_MS = 4000;
const MAX_RETRIES = 10;

const TARGET_VIDEO =
  "https://cdn.shopify.com/videos/c/o/v/cd3df8d6c9324b0ab1b66f84b35d7203.mov";

// ✅ FIXED: NO dp-media-box wrapper
const YOUTUBE_VIDEO_BLOCK = `
<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;">
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

      if (
        !body.includes("Automatic Barn Door Opener") &&
        !body.includes("SlideDrive™")
      ) continue;

      let updated = false;

      // =========================
      // 🔥 STEP 1: REMOVE ALL VIDEO + IFRAME + JUNK
      // =========================
      let cleaned = body
        .replace(/<video[\s\S]*?>[\s\S]*?<\/video>/gi, "")
        .replace(/<video[\s\S]*?>/gi, "")
        .replace(/<\/video>/gi, "")
        .replace(/<source[\s\S]*?>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/type="video\/mp4"/gi, "")
        .replace(/"\s*&gt;/gi, "")
        .replace(/&gt;/gi, "")
        .replace(new RegExp(TARGET_VIDEO, "g"), "");

      // =========================
      // 🔥 STEP 2: REMOVE NESTED MEDIA BOXES
      // =========================
      cleaned = cleaned.replace(
        /<div class="dp-media-box">\s*<div class="dp-media-box">/g,
        '<div class="dp-media-box">'
      );

      if (cleaned !== body) {
        body = cleaned;
        updated = true;
      }

      // =========================
      // 🎯 STEP 3: INSERT VIDEO PROPERLY
      // =========================
      if (!body.includes("youtube.com/embed/RGSK62chHlY")) {

        const mediaBoxRegex = /<div class="dp-media-box">/;

        if (mediaBoxRegex.test(body)) {
          body = body.replace(
            mediaBoxRegex,
            `<div class="dp-media-box">\n${YOUTUBE_VIDEO_BLOCK}`
          );

          console.log("🎯 Inserted video:", p.handle);
          updated = true;
        } else {
          // fallback (top)
          body = YOUTUBE_VIDEO_BLOCK + body;
          console.log("⬆️ Inserted at top:", p.handle);
          updated = true;
        }
      }

      // =========================
      // ✅ UPDATE PAGE
      // =========================
      if (updated) {
        await shopifyFetch(`/pages/${p.id}.json`, {
          method: "PUT",
          body: JSON.stringify({
            page: {
              body_html: body,
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