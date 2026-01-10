import { pushPageToShopify } from "@/lib/shopify/pushPageToShopify";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildHtmlFromSections } from "@/lib/renderers/buildHtmlFromSections";



export async function approvePublishAndPush(pageId: string) {
  // 1. Publish in TradePilot
  await supabaseAdmin.rpc("approve_and_publish_page", {
    p_page_id: pageId,
  });

  // 2. Load page preview
  const { data: page } = await supabaseAdmin
    .from("preview_generated_pages")
    .select("*")
    .eq("page_id", pageId)
    .single();

  if (!page) throw new Error("Page not found");

  // 3. Push to Shopify
  const shopifyPageId = await pushPageToShopify({
    page_id: page.page_id,
    title: page.title,
    slug: page.slug,
    html: buildHtmlFromSections(page.sections),
    city: page.city_name,
    state: page.state_name,
    page_type: page.page_type,
  });

  // 4. Save Shopify linkage
  await supabaseAdmin
    .from("generated_pages")
    .update({
      shopify_page_id: shopifyPageId,
      pushed_to_shopify: true,
    })
    .eq("id", pageId);
}

