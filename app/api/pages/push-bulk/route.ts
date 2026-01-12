export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderPorchSwingCityHTML } from "@/lib/templates/renderPorchSwingCityHTML";
import { renderPorchSwingDeliveryCityHTML } from "@/lib/templates/renderPorchSwingDeliveryCityHTML";
import { pushPageToShopify } from "@/lib/shopify/pushPageToShopify";

export async function POST(req: Request) {
  try {
    const { page_ids } = await req.json();

    if (!Array.isArray(page_ids) || page_ids.length === 0) {
      return NextResponse.json({ error: "page_ids required" }, { status: 400 });
    }

    const results: any[] = [];

    for (const page_id of page_ids) {
      try {
        /* -------------------------
           Load generated page
        ------------------------- */
        const { data: page, error } = await supabaseAdmin
          .from("generated_pages")
          .select(`
            id,
            title,
            slug,
            page_type,
            page_template,
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
          `)
          .eq("id", page_id)
          .single();

        if (error || !page) {
          throw new Error("Generated page not found");
        }

        /* -------------------------
           Normalize joins
        ------------------------- */
        const location = Array.isArray(page.us_locations)
          ? page.us_locations[0]
          : page.us_locations;

        const state = Array.isArray(page.us_states)
          ? page.us_states[0]
          : page.us_states;

        if (!location || !state) {
          throw new Error("Location or state missing");
        }

        /* -------------------------
           Fetch nearby cities
        ------------------------- */
        const { data: nearbyCities } = await supabaseAdmin
          .from("us_locations")
          .select("city_name, slug")
          .eq("state_id", location.state_id)
          .neq("id", location.id)
          .limit(6);

        /* -------------------------
           Render HTML (EXACT SAME AS SINGLE PUSH)
        ------------------------- */
        let html = "";

        if (page.page_template === "porch_swing_delivery") {
          html = renderPorchSwingDeliveryCityHTML({
            city: location.city_name,
            state: state.state_name,
            stateCode: state.state_code,
            slug: page.slug,
            heroImageUrl: page.hero_image_url,
          });
        } else {
          html = renderPorchSwingCityHTML({
            city: location.city_name,
            state: state.state_name,
            stateCode: state.state_code,
            slug: page.slug,
            heroImageUrl: page.hero_image_url,
            nearbyCities:
              nearbyCities?.map((c) => ({
                city: c.city_name,
                slug: `porch-swings-${c.slug}`,
              })) || [],
          });
        }

        /* -------------------------
           Push to Shopify
        ------------------------- */
        const shopifyPageId = await pushPageToShopify({
          page_id: page.id,
          title: page.title,
          slug: page.slug,
          html,
          city: location.city_name,
          state: state.state_name,
          page_type: page.page_type,
        });

        /* -------------------------
           Save Shopify ID
        ------------------------- */
        await supabaseAdmin
          .from("generated_pages")
          .update({
            shopify_page_id: shopifyPageId,
            status: "published",
          })
          .eq("id", page.id);

        results.push({
          page_id,
          status: "pushed",
          shopifyPageId,
        });
      } catch (err: any) {
        console.error("Bulk push failed:", page_id, err);
        results.push({
          page_id,
          status: "failed",
          error: err?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    console.error("bulk-push error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
