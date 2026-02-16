// workers/pushPendingWorkerFastSafe.ts

/* ======================================================
   ✅ FAST SMART PUSH WORKER (SAFE UPGRADE)
   Built directly from your WORKING pushPendingWorker.ts

   Upgrades:
   - Bigger bursts
   - Faster per-page delay
   - Stops instantly on Shopify throttle
   - Sleeps hard, then resumes
====================================================== */

/* ======================================================
   ✅ ENV LOADING (PM2 SAFE)
====================================================== */

import dotenv from "dotenv";
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

/* ======================================================
   IMPORTS (UNCHANGED)
====================================================== */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

/* ======================================================
   ⚡ FAST SETTINGS (ONLY SPEED CHANGES)
====================================================== */

const BATCH_SIZE = 200;          // was 150
const INTERVAL_MS = 5_000;       // was 60s (loop faster)

const SHOPIFY_DELAY_MS = 250;    // was 1000ms (4x faster)

const THROTTLE_REST_MS = 90_000; // rest hard if Shopify throttles
const BURST_REST_MS = 10_000;    // short rest between bursts

const MAX_RETRIES = 10;

/* ======================================================
   HELPERS
====================================================== */

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ======================================================
   PAGE TYPE ROUTER (UNCHANGED)
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
   ✅ SAFE SHOPIFY PUSH (SAME LOGIC)
   + Instant Global Throttle Stop
====================================================== */

async function safeCreateShopifyPage(payload: any) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await createShopifyPage(payload);
    } catch (err: any) {
      const msg = err?.message || "";

      const isThrottle =
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("Exceeded 2 calls per second") ||
        msg.includes("throttled");

      // ✅ FAST MODE: Stop immediately on first throttle
      if (isThrottle) {
        console.log("🛑 SHOPIFY THROTTLE HIT — STOPPING BURST");
        return { throttle_hit: true };
      }

      console.log(`⚠️ Shopify error retrying (${attempt}/${MAX_RETRIES}) → ${msg}`);

      await sleep(500 * attempt);
    }
  }

  return { failed_out: true };
}

/* ======================================================
   ✅ CLAIM + LOCK PAGES FIRST (UNCHANGED)
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

  if (!pages || pages.length === 0) return [];

  // ✅ Lock them immediately
  const ids = pages.map((p) => p.id);

  await supabaseAdmin
    .from("generated_pages")
    .update({ status: "publishing" })
    .in("id", ids);

  console.log(`⚡ Locked ${pages.length} pages`);

  return pages;
}

/* ======================================================
   PUBLISH ONE PAGE (UNCHANGED)
====================================================== */

async function publishOne(page: any) {
  const city = page.us_locations?.city_name;
  const state = page.us_locations?.us_states?.state_name;
  const stateCode = page.us_locations?.us_states?.state_code;

  if (!city || !state || !stateCode) return "SKIP";

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

  if (!html || html.trim().length < 50) return "SKIP";

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

  // 🛑 Global throttle stop
  if (shopifyPage?.throttle_hit) return "THROTTLE";

  if (shopifyPage?.failed_out) throw new Error("Failed after retries");

  /* ---------- Update Supabase ---------- */
  await supabaseAdmin
    .from("generated_pages")
    .update({
      shopify_page_id: shopifyPage.id,
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

async function runBatch() {
  console.log("🚀 FAST PUSH WORKER RUNNING...");

  const pages = await claimPages();

  if (!pages.length) {
    console.log("✅ No pending pages left.");
    return;
  }

  console.log(`⚡ BURST PUSHING ${pages.length} pages...`);

  for (const page of pages) {
    try {
      const result = await publishOne(page);

      // 🛑 If throttle → stop entire burst and rest
      if (result === "THROTTLE") {
        console.log(`😴 Throttle rest: sleeping ${THROTTLE_REST_MS / 1000}s`);

        // Requeue current page
        await supabaseAdmin
          .from("generated_pages")
          .update({
            status: "generated",
            publish_error: "Throttle rest triggered",
          })
          .eq("id", page.id);

        await sleep(THROTTLE_REST_MS);
        return;
      }

      await sleep(SHOPIFY_DELAY_MS);
    } catch (err: any) {
      console.error(`❌ FAILED → ${page.slug}`, err?.message);

      await supabaseAdmin
        .from("generated_pages")
        .update({
          status: "error",
          publish_error: err?.message || "Unknown error",
        })
        .eq("id", page.id);
    }
  }

  console.log("🏁 Burst complete.");
  await sleep(BURST_REST_MS);
}

/* ======================================================
   ✅ RUN FOREVER
====================================================== */

console.log("🔥 Fast Safe Push Worker Started");

async function runForever() {
  while (true) {
    await runBatch();
    await sleep(INTERVAL_MS);
  }
}

runForever();
