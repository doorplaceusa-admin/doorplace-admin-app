import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

const BATCH_SIZE = 10;                 // pages per mini-batch
const MAX_PAGES_PER_RUN = 200;         // ⛔ HARD SAFETY CAP
const PAGE_COOLDOWN_MS = 900;
const BATCH_COOLDOWN_MS = 2500;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔥 Determine pageType from template
function getPageType(template: string) {
  switch (template) {
    case "porch_swing_material_city":
      return "material";
    case "porch_swing_size_city":
      return "size";
    case "door_city":
      return "door";
    case "porch_swing_delivery":
      return "install";
    default:
      return "general";
  }
}

export async function POST() {
  try {
    console.log("🚀 PUSH PENDING STARTED");

    const { data: pages, error } = await supabaseAdmin
      .from("generated_pages")
      .select(`
        *,
        us_locations (
          city_name,
          slug,
          us_states (
            state_name,
            state_code
          )
        )
      `)
      .eq("status", "generated")
      .is("shopify_page_id", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!pages || pages.length === 0) {
      console.log("✅ No pending pages");
      return NextResponse.json({ success: true, message: "No pending pages" });
    }

    // ⛔ LIMIT WORKLOAD PER RUN
    const pagesToProcess = pages.slice(0, MAX_PAGES_PER_RUN);

    console.log(
      `📦 Found ${pages.length} pending pages, processing ${pagesToProcess.length}`
    );

    let published = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < pagesToProcess.length; i += BATCH_SIZE) {
      const batch = pagesToProcess.slice(i, i + BATCH_SIZE);

      console.log(`➡️ Processing batch ${i + 1}-${i + batch.length}`);

      for (const page of batch) {
        try {
          const city = page.us_locations?.city_name;
          const state = page.us_locations?.us_states?.state_name;
          const stateCode = page.us_locations?.us_states?.state_code;

          if (!city || !state || !stateCode) {
            skipped++;
            console.warn(`⚠️ Missing city/state → ${page.title}`);
            continue;
          }

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
            console.warn(`⚠️ Empty HTML → ${page.title}`);
            continue;
          }

          const pageType = getPageType(page.page_template);

          const seoDescription = buildMetaDescription({
            pageType,
            city,
            stateCode,
            material: pageType === "material" ? page.variant_key : undefined,
            size: pageType === "size" ? page.variant_key : undefined,
          });

          const shopifyPage = await createShopifyPage({
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

          published++;
          console.log(`✅ Published → ${page.title}`);

          await sleep(PAGE_COOLDOWN_MS);

        } catch (err: any) {
          failed++;
          console.error(`❌ FAILED → ${page.title}`, err?.message);

          await supabaseAdmin
            .from("generated_pages")
            .update({
              status: "error",
              publish_error: err?.message || "Shopify publish failed",
            })
            .eq("id", page.id);
        }
      }

      console.log("⏳ Batch cooldown");
      await sleep(BATCH_COOLDOWN_MS);
    }

    console.log("🎉 PUSH RUN COMPLETE");

    // 🔁 AUTO-RESTART IF MORE WORK EXISTS
    if (pages.length > MAX_PAGES_PER_RUN) {
      console.log("🔁 More pages remain — restarting push job");

      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-pending`, {
        method: "POST",
      }).catch(() => {
        console.warn("⚠️ Auto-restart fetch failed");
      });
    }

    return NextResponse.json({
      success: true,
      totalFound: pages.length,
      processedThisRun: pagesToProcess.length,
      published,
      skipped,
      failed,
    });

  } catch (err: any) {
    console.error("🔥 PUSH CRASHED", err);
    return NextResponse.json(
      { error: err.message || "Push failed" },
      { status: 500 }
    );
  }
}
