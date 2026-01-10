import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderPorchSwingCityHTML } from "@/lib/templates/renderPorchSwingCityHTML";
import { pushPageToShopify } from "@/lib/shopify/pushPageToShopify";

export async function POST(req: Request) {
  try {
    const { page_ids } = await req.json();

    if (!Array.isArray(page_ids) || page_ids.length === 0) {
      return NextResponse.json({ error: "page_ids required" }, { status: 400 });
    }

    let pushed = 0;
    let failed: string[] = [];

    for (const page_id of page_ids) {
      try {
        /* ------------------------------------
           Load page + hero image + location
        ------------------------------------ */
        const { data: page, error } = await supabaseAdmin
          .from("generated_pages")
          .select(
            `
            id,
            title,
            slug,
            page_type,
            hero_image_url,
            us_locations (
              id,
              city_name,
              slug,
              state_id
            ),
            us_states (
              id,
              state_name,
              state_code
            )
          `
          )
          .eq("id", page_id)
          .single();

        if (error || !page) {
          throw new Error("Page not found");
        }

        const location = Array.isArray(page.us_locations)
          ? page.us_locations[0]
          : page.us_locations;

        const state = Array.isArray(page.us_states)
          ? page.us_states[0]
          : page.us_states;

        if (!location || !state) {
          throw new Error("Location/state missing");
        }

        /* ------------------------------------
           Render HTML (WITH hero image)
        ------------------------------------ */
        const html = renderPorchSwingCityHTML({
          city: location.city_name,
          state: state.state_name,
          stateCode: state.state_code,
          slug: page.slug,
          nearbyCities: [],
          heroImageUrl: page.hero_image_url,
        });

        /* ------------------------------------
           Push to Shopify
        ------------------------------------ */
        const shopifyPageId = await pushPageToShopify({
          page_id: page.id,
          title: page.title,
          slug: page.slug,
          html,
          city: location.city_name,
          state: state.state_name,
          page_type: page.page_type,
        });

        /* ------------------------------------
           Mark as published
        ------------------------------------ */
        await supabaseAdmin
          .from("generated_pages")
          .update({
            shopify_page_id: shopifyPageId,
            status: "published",
          })
          .eq("id", page.id);

        pushed++;
      } catch (err) {
        console.error("Bulk push failed:", page_id, err);
        failed.push(page_id);
      }
    }

    return NextResponse.json({
      success: true,
      pushed,
      failed,
    });
  } catch (err: any) {
    console.error("push-bulk error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
