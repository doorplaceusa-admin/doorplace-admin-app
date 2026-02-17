// workers/pushPendingWorker.ts

/* ======================================================
   ✅ ENV LOADING (PM2 SAFE)
====================================================== */

import dotenv from "dotenv";
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

/* ======================================================
   IMPORTS
====================================================== */
import { getShopifyPageByHandle } from "@/lib/shopify/getShopifyPageByHandle";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

/* ======================================================
   ENTERPRISE SETTINGS
====================================================== */

const BATCH_SIZE = 150;
const INTERVAL_MS = 60_000;

const SHOPIFY_DELAY_MS = 1000;
const COOLDOWN_MS = 60_000;
const MAX_RETRIES = 10;

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
   ✅ SAFE SHOPIFY PUSH (RETRY + COOLDOWN)
====================================================== */

async function safeCreateShopifyPage(payload: any) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await createShopifyPage(payload);
    } catch (err: any) {
      const msg = err?.message || "";

      // ✅ HANDLE TAKEN FIRST
      const isHandleTaken =
        msg.includes("handle") &&
        msg.includes("has already been taken");

      if (isHandleTaken) {
        return { handle_taken: true };
      }

      // ✅ THROTTLE SECOND
      const isThrottle =
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("Exceeded 2 calls per second");

      if (isThrottle) {
        console.log(`⏳ Shopify throttled… retrying (${attempt}/${MAX_RETRIES})`);

        await sleep(2000 * attempt);

        if (attempt >= 6) {
          console.log("🛑 Cooldown wall triggered… sleeping 60s");
          await sleep(COOLDOWN_MS);
        }

        continue;
      }

      throw err;
    }
  }

  return { throttled_out: true };
}


/* ======================================================
   ✅ CLAIM + LOCK PAGES FIRST (WITH RECLAIM)
====================================================== */

async function claimPages() {
  console.log("🔍 Claiming pending pages...");

  const tenMinutesAgo = new Date(
    Date.now() - 10 * 60 * 1000
  ).toISOString();

  // ✅ FAST CLAIM (NO JOIN)
  const { data: pages, error } = await supabaseAdmin
    .from("generated_pages")
    .select("id, slug, title, page_template, variant_key, template_suffix, hero_image_url")
    .or(
      `status.eq.generated,and(status.eq.publishing,publishing_started_at.lt.${tenMinutesAgo})`
    )
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
    .update({
      status: "publishing",
      publishing_started_at: new Date().toISOString(),
    })
    .in("id", ids);

  console.log(`✅ Locked ${pages.length} pages`);

  return pages;
}



/* ======================================================
   PUBLISH ONE PAGE
====================================================== */

async function publishOne(page: any) {
    // ✅ Load full relational data AFTER claim
  const { data: fullPage, error } = await supabaseAdmin
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
    .eq("id", page.id)
    .single();

  if (error || !fullPage) return;

  page = fullPage;

  const city = page.us_locations?.city_name;
  const state = page.us_locations?.us_states?.state_name;
  const stateCode = page.us_locations?.us_states?.state_code;

  if (!city || !state || !stateCode) return;

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

  if (!html || html.trim().length < 50) return;

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
// ✅ HANDLE ALREADY EXISTS → LINK IT INSTEAD OF FAILING
if (shopifyPage?.handle_taken) {
  console.log(`🟡 Handle already exists → fetching page: ${page.slug}`);

  const existing = await getShopifyPageByHandle(page.slug);

  if (existing?.id) {
    await supabaseAdmin
      .from("generated_pages")
      .update({
        shopify_page_id: existing.id,
        status: "published",
        published_at: new Date().toISOString(),
        publish_error: null,
      })
      .eq("id", page.id);

    console.log(`✅ Linked existing Shopify page → ${page.slug}`);
    return;
  }

  // If we can't find it, mark error
  await supabaseAdmin
    .from("generated_pages")
    .update({
      status: "error",
      publish_error: "Handle taken but page not found in Shopify",
    })
    .eq("id", page.id);

  return;
}

  // ✅ If throttle wall → requeue instead of failing
  if (shopifyPage?.throttled_out) {
    console.log(`🟡 Throttle wall → requeueing ${page.slug}`);

    await supabaseAdmin
      .from("generated_pages")
      .update({
        status: "generated",
        publish_error: "Throttle wall — retry later",
      })
      .eq("id", page.id);

    return;
  }

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

  console.log(`✅ Published → ${page.slug}`);
}

/* ======================================================
   ENTERPRISE BATCH LOOP
====================================================== */

async function runBatch() {
  console.log("🚀 PUSH WORKER RUNNING...");

  const pages = await claimPages();

  if (!pages.length) {
    console.log("✅ No pending pages left.");
    return;
  }

  console.log(`📦 Processing ${pages.length} pages...`);

  for (const page of pages) {
    try {
      await publishOne(page);
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

  console.log("🏁 Batch complete.");
}

/* ======================================================
   ✅ RUN FOREVER (NO OVERLAP)
====================================================== */

console.log("🔥 Push Pending Worker Started (Enterprise Mode)");

async function runForever() {
  while (true) {
    await runBatch();
    await sleep(INTERVAL_MS);
  }
}

runForever();
