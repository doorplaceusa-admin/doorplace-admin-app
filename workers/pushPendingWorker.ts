// workers/pushPendingWorkerEnterprise.ts

/* ======================================================
   ✅ ENV LOADING (PM2 SAFE)
====================================================== */

import dotenv from "dotenv";
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

/* ======================================================
   IMPORTS
====================================================== */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

/* ======================================================
   ENTERPRISE SETTINGS (SAFE MAX)
====================================================== */

const BATCH_SIZE = 100; // grab 100 pages per cycle
const CONCURRENCY = 3; // process 3 per chunk (NOT parallel)
const INTERVAL_MS = 30_000; // run every 30 seconds

// ✅ Shopify throttle-safe delay
const SHOPIFY_DELAY_MS = 800;

/* ======================================================
   HELPERS
====================================================== */

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ======================================================
   PAGE TYPE ROUTER
====================================================== */

function getPageType(template: string) {
  switch (template) {
    case "porch_swing_material_city":
      return "material";

    case "porch_swing_size_city":
      return "size";

    case "door_city":
    case "custom_door_installation_city":
      return "door";

    case "porch_swing_delivery":
      return "install";

    default:
      return "general";
  }
}

/* ======================================================
   SAFE SHOPIFY PUSH (AUTO RETRY)
====================================================== */

async function safeCreateShopifyPage(payload: any) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await createShopifyPage(payload);
    } catch (err: any) {
      const msg = err?.message || "";

      // ✅ Shopify throttle retry
      if (
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("Exceeded 2 calls per second")
      ) {
        console.log(`⏳ Shopify throttled… retrying (${attempt}/5)`);

        // exponential backoff
        await sleep(2000 * attempt);
        continue;
      }

      throw err;
    }
  }

  throw new Error("Shopify failed after 5 retries");
}

/* ======================================================
   CLAIM PAGES FIRST (PREVENT DUPLICATES)
====================================================== */

async function claimPages() {
  console.log("🔍 Claiming pending pages...");

  const { data: pages, error } = await supabaseAdmin
    .from("generated_pages")
    .select(
      `
      *,
      us_locations (
        city_name,
        slug,
        us_states (
          state_name,
          state_code
        )
      )
    `
    )
    .eq("status", "generated")
    .is("shopify_page_id", null)
    .eq("is_duplicate", false)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("❌ Supabase fetch error:", error.message);
    return [];
  }

  if (!pages || pages.length === 0) {
    return [];
  }

  // ✅ Lock immediately
  const ids = pages.map((p) => p.id);

  await supabaseAdmin
    .from("generated_pages")
    .update({ status: "publishing" })
    .in("id", ids);

  console.log(`✅ Locked ${pages.length} pages`);

  return pages;
}

/* ======================================================
   PUBLISH ONE PAGE
====================================================== */

async function publishOne(page: any) {
  try {
    const city = page.us_locations?.city_name;
    const state = page.us_locations?.us_states?.state_name;
    const stateCode = page.us_locations?.us_states?.state_code;

    if (!city || !state || !stateCode) {
      console.log("⚠️ Missing location data → skipping");
      return;
    }

    /* ---------- Render HTML ---------- */
    const html = renderPageTemplateHTML({
      page_template: page.page_template,
      variant_key: page.variant_key ?? null,
      city,
      state,
      stateCode,
      slug: page.slug,
      heroImageUrl: page.hero_image_url,
    });

    if (!html || html.trim().length < 50) {
      console.log(`⚠️ HTML too short → skipping ${page.slug}`);
      return;
    }

    /* ---------- SEO Meta ---------- */
    const pageType = getPageType(page.page_template);

    const seoDescription = buildMetaDescription({
      pageType,
      city,
      stateCode,
      material: pageType === "material" ? page.variant_key : undefined,
      size: pageType === "size" ? page.variant_key : undefined,
      template: page.page_template,
    });

    /* ---------- Shopify Push ---------- */
    const shopifyPage = await safeCreateShopifyPage({
      title: page.title,
      handle: page.slug,
      body_html: html,
      template_suffix: page.template_suffix || null,
      meta_description: seoDescription,
    });

    /* ---------- Supabase Update ---------- */
    await supabaseAdmin
      .from("generated_pages")
      .update({
        shopify_page_id: shopifyPage.id,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", page.id);

    console.log(`✅ Published → ${page.slug}`);
  } catch (err: any) {
    const msg = err?.message || "Unknown error";

    console.error(`❌ FAILED → ${page.slug}`, msg);

    // Mark error in DB
    await supabaseAdmin
      .from("generated_pages")
      .update({
        status: "error",
        publish_error: msg,
      })
      .eq("id", page.id);
  }
}

/* ======================================================
   ENTERPRISE LOOP (SAFE SPEED)
====================================================== */

async function runEnterpriseBatch() {
  console.log("🚀 ENTERPRISE PUSH RUNNING...");

  const pages = await claimPages();

  if (!pages.length) {
    console.log("✅ No pending pages left.");
    return;
  }

  console.log(`📦 Processing ${pages.length} claimed pages...`);

  // ✅ Process in chunks (NOT parallel burst)
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const chunk = pages.slice(i, i + CONCURRENCY);

    for (const page of chunk) {
      await publishOne(page);

      // ✅ Shopify throttle-safe delay
      await sleep(SHOPIFY_DELAY_MS);
    }

    // micro pause between chunks
    await sleep(500);
  }

  console.log("🏁 Enterprise batch complete");
}

/* ======================================================
   RUN FOREVER (PM2 SAFE)
====================================================== */

console.log("🔥 Enterprise Push Worker Started");

runEnterpriseBatch();

// Repeat forever every 30 seconds
setInterval(runEnterpriseBatch, INTERVAL_MS);
