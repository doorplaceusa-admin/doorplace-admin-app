import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";
import { renderPageTemplateHTML } from "@/lib/renderers/renderPageTemplateHTML";
import { buildMetaDescription } from "@/lib/seo/build_meta/description";

const BATCH_SIZE = 15;

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
  try {
    console.log("🚀 PUSH PENDING STARTED");

    /* -----------------------------------------
       FETCH ONLY VALID, NON-DUPLICATE PAGES
    ----------------------------------------- */
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
      .eq("is_duplicate", false) // 🔒 HARD BLOCK
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw error;

    if (!pages || pages.length === 0) {
      console.log("✅ NO PENDING PAGES LEFT");
      return NextResponse.json({ success: true });
    }

    console.log(`📦 Processing ${pages.length} pages`);

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

        const pageType = getPageType(page.page_template);

        const seoDescription = buildMetaDescription({
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

        await sleep(900);

      } catch (err: any) {
        const message = err?.message || "";

        /* -----------------------------------------
           HANDLE DUPLICATE HANDLE (FOREVER FIX)
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
            .eq("slug", page.slug); // 🔥 ALL DUPES AT ONCE

          console.log(`⏭️ Marked duplicate → ${page.slug}`);
          continue;
        }

        console.error(`❌ FAILED → ${page.title}`, message);

        /* -----------------------------------------
           HARD FAIL CONDITIONS
        ----------------------------------------- */
        if (message.includes("Unsupported page_template") ||
            message.includes("requires variant_key")) {
          failed++;

          await supabaseAdmin
            .from("generated_pages")
            .update({
              status: "failed",
              publish_error: message,
            })
            .eq("id", page.id);

          continue;
        }

        /* -----------------------------------------
           TRANSIENT ERROR (RETRY ALLOWED)
        ----------------------------------------- */
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

    /* -----------------------------------------
       CHECK IF MORE REMAIN
    ----------------------------------------- */
    const { count } = await supabaseAdmin
      .from("generated_pages")
      .select("*", { count: "exact", head: true })
      .eq("status", "generated")
      .is("shopify_page_id", null)
      .eq("is_duplicate", false);

    if (count && count > 0) {
      console.log(`🔁 ${count} pages remaining → restarting push`);

      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/pages/push-pending`, {
        method: "POST",
      }).catch(() => {});
    } else {
      console.log("🎉 ALL PAGES PROCESSED");
    }

    return NextResponse.json({
      success: true,
      processed: pages.length,
      published,
      skipped,
      failed,
      remaining: count ?? 0,
    });

  } catch (err: any) {
    console.error("🔥 PUSH CRASHED", err);
    return NextResponse.json(
      { error: err.message || "Push failed" },
      { status: 500 }
    );
  }
}
