// workers/pushPendingWorker.ts

/* ======================================================
   ✅ ENV LOADING (FIXED)
   PM2 + Node workers do NOT auto-load .env.local
====================================================== */

import dotenv from "dotenv";

// ✅ Force-load the correct env file explicitly
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

// ✅ Debug proof (remove later if you want)
console.log("SHOPIFY ENV CHECK:", {
  STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN
    ? process.env.SHOPIFY_ACCESS_TOKEN.slice(0, 10) + "..."
    : undefined,
  API_VERSION: process.env.SHOPIFY_API_VERSION,
});

/* ======================================================
   IMPORTS
====================================================== */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

/* ===============================
   WORKER SETTINGS
================================ */

const BATCH_SIZE = 20; // push 20 per cycle
const INTERVAL_MS = 60_000; // run every 1 minute

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ===============================
   SINGLE SOURCE OF TRUTH
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
   PUSH ONE BATCH
================================ */

async function pushBatch() {
  console.log("🚀 PUSH WORKER RUNNING...");

  /* -----------------------------------------
     FETCH ONLY VALID, NON-DUPLICATE PAGES
  ----------------------------------------- */
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
    return;
  }

  if (!pages || pages.length === 0) {
    console.log("✅ NO PENDING PAGES LEFT");
    return;
  }

  console.log(`📦 Processing ${pages.length} pages...`);

  let published = 0;
  let skipped = 0;
  let failed = 0;

  /* -----------------------------------------
     PROCESS BATCH
  ----------------------------------------- */
  for (const page of pages) {
    try {
      const city = page.us_locations?.city_name;
      const state = page.us_locations?.us_states?.state_name;
      const stateCode = page.us_locations?.us_states?.state_code;

      if (!city || !state || !stateCode) {
        skipped++;
        continue;
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
        skipped++;
        continue;
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

      /* ---------- Push Shopify Page ---------- */
      const shopifyPage = await createShopifyPage({
        title: page.title,
        handle: page.slug,
        body_html: html,
        template_suffix: page.template_suffix || null,
        meta_description: seoDescription,
      });

      /* ---------- Update Supabase ---------- */
      await supabaseAdmin
        .from("generated_pages")
        .update({
          shopify_page_id: shopifyPage.id,
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", page.id);

      published++;
      console.log(`✅ Published → ${page.title}`);

      // Shopify throttle safety
      await sleep(900);
    } catch (err: any) {
      const message = err?.message || "";

      /* -----------------------------------------
         DUPLICATE HANDLE FIX
      ----------------------------------------- */
      if (message.includes("handle") && message.includes("already been taken")) {
        skipped++;

        await supabaseAdmin
          .from("generated_pages")
          .update({
            is_duplicate: true,
            status: "skipped",
            publish_error: "duplicate handle exists in Shopify",
          })
          .eq("slug", page.slug);

        console.log(`⏭️ Marked duplicate → ${page.slug}`);
        continue;
      }

      console.error(`❌ FAILED → ${page.title}`, message);

      failed++;

      await supabaseAdmin
        .from("generated_pages")
        .update({
          status: "error",
          publish_error: message,
        })
        .eq("id", page.id);
    }
  }

  console.log("🏁 Batch Complete:", {
    published,
    skipped,
    failed,
  });
}

/* ===============================
   RUN FOREVER (NO RECURSION)
================================ */

console.log("🔥 Push Pending Worker Started (PM2 Mode)");

pushBatch();

// Repeat forever every minute
setInterval(pushBatch, INTERVAL_MS);
