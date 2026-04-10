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

// ✅ YouTube block
const YOUTUBE_VIDEO_BLOCK = `
<div style="margin-bottom:20px;">
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
    <iframe src="https://www.youtube.com/embed/RGSK62chHlY?rel=0&modestbranding=1&playsinline=1"
    frameborder="0"
    allow="encrypted-media"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;">
    </iframe>
  </div>
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

export async function POST() {
  console.log("🎬 VIDEO REPLACE + INJECT STARTED");

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

      // 🔒 Only target your door pages
      if (
        !body.includes("Automatic Barn Door Opener") &&
        !body.includes("SlideDrive™")
      ) {
        continue;
      }

      let updated = false;

      // ✅ Replace raw Shopify video URL
      if (body.includes(TARGET_VIDEO)) {
        console.log("🔁 Replacing video:", p.handle);

        body = body.replace(
          new RegExp(TARGET_VIDEO, "g"),
          YOUTUBE_VIDEO_BLOCK
        );

        updated = true;
      }

      // ✅ Add video if missing (safe prepend)
      if (!body.includes("youtube.com/embed/RGSK62chHlY")) {
        console.log("➕ Adding video:", p.handle);

        body = YOUTUBE_VIDEO_BLOCK + body;

        updated = true;
      }

      // ✅ Update page
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

    // ✅ Cursor pagination (THIS was your missing piece)
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