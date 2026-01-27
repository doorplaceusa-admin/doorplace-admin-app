import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

const BATCH_SIZE = 20;
const CHECK_INTERVAL = 20_000; // 20 seconds
const RATE_LIMIT_DELAY = 900;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPageType(template: string) {
  switch (template) {
    case "porch_swing_material_city": return "material";
    case "porch_swing_size_city": return "size";
    case "door_city":
    case "custom_door_installation_city": return "door";
    case "porch_swing_delivery": return "install";
    default: return "general";
  }
}

async function runWorker() {
  console.log("🧵 Push worker started");

  while (true) {
    try {
      const { data: pages } = await supabaseAdmin
        .from("generated_pages")
        .select(`
          *,
          us_locations (
            city_name,
            us_states (
              state_name,
              state_code
            )
          )
        `)
        .eq("status", "generated")
        .is("shopify_page_id", null)
        .eq("is_duplicate", false)
        .order("created_at", { ascending: true })
        .limit(BATCH_SIZE);

      if (!pages || pages.length === 0) {
        await sleep(CHECK_INTERVAL);
        continue;
      }

      console.log(`📦 Worker pushing ${pages.length} pages`);

      for (const page of pages) {
        try {
          const city = page.us_locations?.city_name;
          const state = page.us_locations?.us_states?.state_name;
          const stateCode = page.us_locations?.us_states?.state_code;
          if (!city || !state || !stateCode) continue;

          const html = renderPageTemplateHTML({
            page_template: page.page_template,
            variant_key: page.variant_key,
            city,
            state,
            stateCode,
            slug: page.slug,
            heroImageUrl: page.hero_image_url,
          });

          const meta = buildMetaDescription({
            pageType: getPageType(page.page_template),
            city,
            stateCode,
            template: page.page_template,
          });

          const shopifyPage = await createShopifyPage({
            title: page.title,
            handle: page.slug,
            body_html: html,
            meta_description: meta,
            template_suffix: page.template_suffix || null,
          });

          await supabaseAdmin
            .from("generated_pages")
            .update({
              shopify_page_id: shopifyPage.id,
              status: "published",
              published_at: new Date().toISOString(),
            })
            .eq("id", page.id);

          console.log(`✅ Worker published → ${page.slug}`);
          await sleep(RATE_LIMIT_DELAY);

        } catch (err: any) {
          console.error("❌ Worker error:", err.message);
        }
      }

    } catch (err) {
      console.error("🔥 Worker loop crashed", err);
      await sleep(10_000);
    }
  }
}

runWorker();
