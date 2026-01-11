import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderPorchSwingCityHTML } from "@/lib/templates/renderPorchSwingCityHTML";
import { renderPorchSwingDeliveryCityHTML } from "@/lib/templates/renderPorchSwingDeliveryCityHTML";
import { pushPageToShopify } from "@/lib/shopify/pushPageToShopify";

export async function POST(req: Request) {
  try {
    const { page_id } = await req.json();

    if (!page_id) {
      return NextResponse.json(
        { error: "Missing page_id" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Generated page not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "Location or state missing" },
        { status: 500 }
      );
    }

    /* -------------------------
       Fetch nearby cities (same state)
    ------------------------- */
    const { data: nearbyCities } = await supabaseAdmin
      .from("us_locations")
      .select("city_name, slug")
      .eq("state_id", location.state_id)
      .neq("id", location.id)
      .limit(6);

    /* -------------------------
       Render HTML (template-aware)
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

    return NextResponse.json({
      success: true,
      shopifyPageId,
    });
  } catch (err: any) {
    console.error("push-to-shopify error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
