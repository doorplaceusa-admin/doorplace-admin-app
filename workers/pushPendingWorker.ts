// workers/pushPendingWorkerEnterprise.ts

import dotenv from "dotenv";
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

/* ===============================
   ENTERPRISE SETTINGS
================================ */

const BATCH_SIZE = 200; // grab 200 per cycle
const CONCURRENCY = 15; // publish 15 at once
const INTERVAL_MS = 30_000; // run every 30 sec

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ===============================
   PAGE TYPE
================================ */

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

/* ===============================
   SAFE SHOPIFY PUSH (Retry)
================================ */

async function safeCreateShopifyPage(payload: any) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await createShopifyPage(payload);
    } catch (err: any) {
      const msg = err?.message || "";

      // Shopify throttle retry
      if (msg.includes("429") || msg.includes("Too Many Requests")) {
        console.log(`⏳ Shopify throttled… retrying (${attempt}/5)`);
        await sleep(1500 * attempt);
        continue;
      }

      throw err;
    }
  }

  throw new Error("Shopify failed after 5 retries");
}

/* ===============================
   CLAIM PAGES FIRST (LOCK)
================================ */

async function claimPages() {
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
    .limit(BATCH_SIZE);

  if (error || !pages?.length) return [];

  // ✅ Lock immediately
  const ids = pages.map((p) => p.id);

  await supabaseAdmin
    .from("generated_pages")
    .update({ status: "publishing" })
    .in("id", ids);

  return pages;
}

/* ===============================
   PUBLISH ONE PAGE
================================ */

async function publishOne(page: any) {
  const city = page.us_locations?.city_name;
  const state = page.us_locations?.us_states?.state_name;
  const stateCode = page.us_locations?.us_states?.state_code;

  if (!city || !state || !stateCode) return;

  const html = renderPageTemplateHTML({
    page_template: page.page_template,
    variant_key: page.variant_key ?? null,
    city,
    state,
    stateCode,
    slug: page.slug,
    heroImageUrl: page.hero_image_url,
  });

  const pageType = getPageType(page.page_template);

  const seoDescription = buildMetaDescription({
    pageType,
    city,
    stateCode,
    material: pageType === "material" ? page.variant_key : undefined,
    size: pageType === "size" ? page.variant_key : undefined,
    template: page.page_template,
  });

  const shopifyPage = await safeCreateShopifyPage({
    title: page.title,
    handle: page.slug,
    body_html: html,
    template_suffix: page.template_suffix || null,
    meta_description: seoDescription,
  });

  await supabaseAdmin
    .from("generated_pages")
    .update({
      shopify_page_id: shopifyPage.id,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", page.id);

  console.log(`✅ Published → ${page.slug}`);
}

/* ===============================
   ENTERPRISE LOOP
================================ */

async function runEnterpriseBatch() {
  console.log("🚀 ENTERPRISE PUSH RUNNING...");

  const pages = await claimPages();

  if (!pages.length) {
    console.log("✅ No pending pages.");
    return;
  }

  console.log(`📦 Claimed ${pages.length} pages`);

  // Publish in parallel chunks
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const chunk = pages.slice(i, i + CONCURRENCY);

    await Promise.all(chunk.map(publishOne));

    // micro pause between chunks
    await sleep(500);
  }

  console.log("🏁 Enterprise batch complete");
}

/* ===============================
   RUN FOREVER
================================ */

console.log("🔥 Enterprise Worker Started");

runEnterpriseBatch();
setInterval(runEnterpriseBatch, INTERVAL_MS);
