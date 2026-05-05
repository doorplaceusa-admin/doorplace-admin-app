export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 4000;
const JITTER_MS = 1200;
const MAX_RETRIES = 5;
const BATCH_SIZE = 100;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return SHOPIFY_DELAY_MS + Math.floor(Math.random() * JITTER_MS);
}

async function safeShopifyFetch(path: string, options: RequestInit = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await shopifyLimiter();

      const res = await fetch(
        `https://${SHOP}/admin/api/${API_VERSION}${path}`,
        {
          ...options,
          headers: {
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json",
            ...(options.headers || {}),
          },
        }
      );

      if (res.status === 429) {
        console.log(`Throttled. Attempt ${attempt}`);
        await sleep(2000 * attempt);
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        console.log("Shopify error:", txt);
        await sleep(1500 * attempt);
        continue;
      }

      return res;
    } catch (err) {
      console.log("Network error:", err);
      await sleep(2000 * attempt);
    }
  }

  console.log("Failed after retries:", path);
  return null;
}

function extractHandle(urlString: string) {
  return urlString.split("/").pop()?.trim() || "";
}

export async function POST() {
  console.log("STARTING TP MESH REMOVAL");

  let offset = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const { data: inventory, error } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url");

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }

  if (!inventory || inventory.length === 0) {
    return NextResponse.json({
      success: false,
      message: "No inventory found.",
    });
  }

  while (true) {
    const batch = inventory.slice(offset, offset + BATCH_SIZE);

    if (batch.length === 0) break;

    for (const row of batch) {
      try {
        const handle = extractHandle(String(row.url || ""));

        if (!handle) {
          totalSkipped++;
          continue;
        }

        console.log("Scanning:", handle);

        const findRes = await safeShopifyFetch(`/pages.json?handle=${handle}`);

        if (!findRes) {
          totalErrors++;
          continue;
        }

        const findJson = await findRes.json();

        if (!findJson.pages || findJson.pages.length === 0) {
          totalSkipped++;
          continue;
        }

        const page = findJson.pages[0];
        const pageId = page.id;
        let body = page.body_html || "";

        if (!body.includes("TP_LINK_MESH_START")) {
          totalSkipped++;
          console.log("No mesh found:", handle);
          continue;
        }

        console.log("Removing TP mesh from:", handle);

        body = body.replace(
          /<!-- TP_LINK_MESH_START -->[\s\S]*?<!-- TP_LINK_MESH_END -->/g,
          ""
        );

        const updateRes = await safeShopifyFetch(`/pages/${pageId}.json`, {
          method: "PUT",
          body: JSON.stringify({
            page: {
              id: pageId,
              body_html: body,
            },
          }),
        });

        if (updateRes) {
          totalUpdated++;
          console.log("Cleaned:", handle);
        } else {
          totalErrors++;
          console.log("Failed update:", handle);
        }

        await sleep(randomDelay());
      } catch (err) {
        totalErrors++;
        console.log("Page failed but continuing:", err);
      }
    }

    offset += BATCH_SIZE;
  }

  console.log("TP MESH REMOVAL COMPLETE");
  console.log("Updated:", totalUpdated);
  console.log("Skipped:", totalSkipped);
  console.log("Errors:", totalErrors);

  return NextResponse.json({
    success: true,
    updated: totalUpdated,
    skipped: totalSkipped,
    errors: totalErrors,
  });
}