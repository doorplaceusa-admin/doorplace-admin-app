// workers/pushPendingWorkerFastSmart.ts

/* ======================================================
   ✅ FAST SMART BURST PUSH WORKER
   - Pushes pages in aggressive bursts
   - Stops instantly on Shopify throttle
   - Sleeps (cooldown) then resumes blasting
====================================================== */

import dotenv from "dotenv";
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });
console.log("ENV CHECK:", {
  SUPABASE_URL: process.env.SUPABASE_URL ? "YES" : "NO",
  SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "YES" : "NO",
});

/* ======================================================
   IMPORTS
====================================================== */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

/* ======================================================
   ⚡ FAST MODE SETTINGS
====================================================== */

/** How many pages to grab per burst */
const BURST_SIZE = 200;

/** How fast we fire pages inside a burst */
const FAST_DELAY_MS = 250;

/** Rest time after a throttle hit */
const THROTTLE_REST_MS = 90_000;

/** Normal rest between bursts */
const BURST_REST_MS = 15_000;

/** Loop interval */
const LOOP_INTERVAL_MS = 10_000;

/** Retry attempts per page */
const MAX_RETRIES = 3;

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
   ✅ SMART SHOPIFY PUSH
   - Throws special throttle flag immediately
====================================================== */

async function smartShopifyPush(payload: any) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await createShopifyPage(payload);
    } catch (err: any) {
      const msg = err?.message || "";

      const isThrottle =
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("Exceeded") ||
        msg.includes("throttled");

      if (isThrottle) {
        console.log("🛑 SHOPIFY THROTTLE DETECTED!");
        return { throttle_hit: true };
      }

      console.log(
        `⚠️ Page error retrying (${attempt}/${MAX_RETRIES}) →`,
        msg
      );

      await sleep(500 * attempt);
    }
  }

  return { failed_out: true };
}

/* ======================================================
   ✅ CLAIM PAGES (LOCK THEM)
====================================================== */

async function claimBurstPages() {
  console.log("🔍 Claiming burst pages...");

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
    .limit(BURST_SIZE);

  if (error) {
    console.error("❌ Supabase fetch error:", error.message);
    return [];
  }

  if (!pages || pages.length === 0) return [];

  const ids = pages.map((p) => p.id);

  await supabaseAdmin
    .from("generated_pages")
    .update({ status: "publishing" })
    .in("id", ids);

  console.log(`⚡ Locked ${pages.length} pages for FAST burst`);

  return pages;
}

/* ======================================================
   🚀 PUBLISH ONE PAGE
====================================================== */

async function publishOne(page: any) {
  const city = page.us_locations?.city_name;
  const state = page.us_locations?.us_states?.state_name;
  const stateCode = page.us_locations?.us_states?.state_code;

  if (!city || !state || !stateCode) return null;

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

  if (!html || html.trim().length < 50) return null;

  /* ---------- SEO ---------- */
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
  const result = await smartShopifyPush({
    title: page.title,
    handle: page.slug,
    body_html: html,
    template_suffix: page.template_suffix || null,
    meta_description: seoDescription,
  });

  if (result?.throttle_hit) {
    return "THROTTLE";
  }

  if (result?.failed_out) {
    throw new Error("Page failed after retries");
  }

  /* ---------- Save Published ---------- */
  await supabaseAdmin
    .from("generated_pages")
    .update({
      shopify_page_id: result.id,
      status: "published",
      published_at: new Date().toISOString(),
      publish_error: null,
    })
    .eq("id", page.id);

  console.log(`✅ FAST Published → ${page.slug}`);
  return "OK";
}

/* ======================================================
   ⚡ FAST BURST LOOP
====================================================== */

async function runFastBurst() {
  console.log("🚀 FAST BURST WORKER RUNNING...");

  const pages = await claimBurstPages();

  if (!pages.length) {
    console.log("✅ No pages left.");
    return;
  }

  console.log(`⚡ BURST PUSHING ${pages.length} pages...`);

  for (const page of pages) {
    try {
      const status = await publishOne(page);

      if (status === "THROTTLE") {
        console.log("🛑 BURST STOPPED — RESTING...");
        await sleep(THROTTLE_REST_MS);

        // Requeue unfinished page
        await supabaseAdmin
          .from("generated_pages")
          .update({
            status: "generated",
            publish_error: "Throttle rest triggered",
          })
          .eq("id", page.id);

        return;
      }

      await sleep(FAST_DELAY_MS);
    } catch (err: any) {
      console.error(`❌ FAILED → ${page.slug}`, err.message);

      await supabaseAdmin
        .from("generated_pages")
        .update({
          status: "error",
          publish_error: err.message,
        })
        .eq("id", page.id);
    }
  }

  console.log("🏁 FAST BURST COMPLETE.");
  await sleep(BURST_REST_MS);
}

/* ======================================================
   ✅ RUN FOREVER
====================================================== */

console.log("🔥 FAST SMART PUSH WORKER STARTED");

async function runForever() {
  while (true) {
    await runFastBurst();
    await sleep(LOOP_INTERVAL_MS);
  }
}

runForever();
