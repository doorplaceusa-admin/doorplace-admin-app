import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

const BATCH_SIZE = 15;
const RATE_LIMIT_DELAY = 900;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔥 Single source of truth
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

export async function POST() {
  console.log("🚀 PUSH GENERATED STARTED");

  let totalPublished = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  try {
    while (true) {
      /* -----------------------------------------
         FETCH NEXT BATCH
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

      if (error) throw error;

      if (!pages || pages.length === 0) {
        console.log("🎉 NO GENERATED PAGES LEFT");
        break;
      }

      console.log(`📦 Processing batch of ${pages.length}`);

      /* -----------------------------------------
         PROCESS BATCH
      ----------------------------------------- */
      for (const page of pages) {
        try {
          const city = page.us_locations?.city_name;
          const state = page.us_locations?.us_states?.state_name;
          const stateCode = page.us_locations?.us_states?.state_code;

          if (!city || !state || !stateCode) {
            totalSkipped++;
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
            totalSkipped++;
            continue;
          }

          const pageType = getPageType(page.page_template);

          const metaDescription = buildMetaDescription({
            pageType,
            city,
            stateCode,
            material: pageType === "material" ? page.variant_key : undefined,
            size: pageType === "size" ? page.variant_key : undefined,
            template: page.page_template,
          });

          const shopifyPage = await createShopifyPage({
            title: page.title,
            handle: page.slug,
            body_html: html,
            template_suffix: page.template_suffix || null,
            meta_description: metaDescription,
          });

          await supabaseAdmin
            .from("generated_pages")
            .update({
              shopify_page_id: shopifyPage.id,
              status: "published",
              published_at: new Date().toISOString(),
            })
            .eq("id", page.id);

          totalPublished++;
          console.log(`✅ Published → ${page.slug}`);

          await sleep(RATE_LIMIT_DELAY);

        } catch (err: any) {
          const message = err?.message || "";

          // 🔒 DUPLICATE HANDLE (PERMANENT BLOCK)
          if (message.includes("handle") && message.includes("already been taken")) {
            totalSkipped++;

            await supabaseAdmin
              .from("generated_pages")
              .update({
                is_duplicate: true,
                publish_error: "duplicate handle exists in Shopify",
              })
              .eq("slug", page.slug);

            console.log(`⏭️ Duplicate blocked → ${page.slug}`);
            continue;
          }

          console.error(`❌ Failed → ${page.slug}`, message);
          totalFailed++;

          await supabaseAdmin
            .from("generated_pages")
            .update({
              publish_error: message,
            })
            .eq("id", page.id);
        }
      }

      // small buffer before next batch
      await sleep(1200);
    }

    return NextResponse.json({
      success: true,
      published: totalPublished,
      skipped: totalSkipped,
      failed: totalFailed,
    });

  } catch (err: any) {
    console.error("🔥 PUSH GENERATED CRASHED", err);
    return NextResponse.json(
      { error: err.message || "Push failed" },
      { status: 500 }
    );
  }
}
