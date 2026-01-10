import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/pages/generate-single
 *
 * Body:
 * {
 *   location_id: string,
 *   page_template: string,
 *   hero_image_url?: string
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { location_id, page_template, hero_image_url } = body;

    if (!location_id || !page_template) {
      return NextResponse.json(
        { error: "Missing required fields: location_id, page_template" },
        { status: 400 }
      );
    }

    /* -------------------------
       Load location + state
    ------------------------- */
    const { data: location, error: locationError } = await supabaseAdmin
      .from("us_locations")
      .select(
        `
        id,
        city_name,
        slug,
        state_id,
        us_states (
          id,
          state_name,
          state_code
        )
      `
      )
      .eq("id", location_id)
      .single();

    if (locationError || !location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const state =
      Array.isArray(location.us_states)
        ? location.us_states[0]
        : location.us_states;

    if (!state) {
      return NextResponse.json(
        { error: "State join missing for this location" },
        { status: 500 }
      );
    }

    /* -------------------------
       Prevent duplicates
    ------------------------- */
    const { data: existing } = await supabaseAdmin
      .from("generated_pages")
      .select("id")
      .eq("location_id", location.id)
      .eq("page_template", page_template)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json(
        { error: "Page already exists for this location + template" },
        { status: 409 }
      );
    }

    /* -------------------------
       Build page
    ------------------------- */
    const title = `Porch Swing City in ${location.city_name}, ${state.state_name}`;
    const slug = `porch-swing-city-${location.slug}`;

    /* -------------------------
       Insert page
    ------------------------- */
    const { data: page, error: insertError } = await supabaseAdmin
      .from("generated_pages")
      .insert({
        title,
        slug,
        status: "draft",
        page_type: "city",
        page_template,
        state_id: state.id,
        location_id: location.id,
        hero_image_url: hero_image_url || null, // ✅ saved
      })
      .select("id, title, slug, status, page_template, created_at")
      .single();

    if (insertError || !page) {
      return NextResponse.json(
        { error: insertError?.message || "Insert failed" },
        { status: 500 }
      );
    }

    /* -------------------------
       Insert default sections
    ------------------------- */
    await supabaseAdmin.from("generated_page_sections").insert([
      {
        page_id: page.id,
        section_type: "hero",
        section_order: 1,
        content: {
          headline: "Custom Porch Swings Built for Your Area",
          subheadline: "Handcrafted. Built to last. Installed locally.",
          hero_image_url: hero_image_url || null,
        },
      },
      {
        page_id: page.id,
        section_type: "content",
        section_order: 2,
        content: {
          body: `Serving customers in ${location.city_name}, ${state.state_code}.`,
        },
      },
      {
        page_id: page.id,
        section_type: "cta",
        section_order: 3,
        content: {
          button_text: "Get a Fast Quote",
          button_url: "/pages/get-a-fast-quote",
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (err: any) {
    console.error("generate-single error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
