import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const location_ids: string[] = body.location_ids ?? body.city_ids ?? [];

    const page_template = body.page_template || "porch_swing_city";
    const page_type = body.page_type || "city";
    const status = body.status || "draft";
    const hero_image_url = body.hero_image_url || null;

    if (!Array.isArray(location_ids) || location_ids.length === 0) {
      return NextResponse.json(
        { error: "location_ids required" },
        { status: 400 }
      );
    }

    /* -----------------------------------
       Load cities + states (correct join)
    ----------------------------------- */
    const { data: locs, error: locErr } = await supabaseAdmin
      .from("us_locations")
      .select(`
        id,
        city_name,
        slug,
        state_id,
        us_states:state_id (
          state_name,
          state_code
        )
      `)
      .in("id", location_ids);

    if (locErr || !locs) {
      return NextResponse.json(
        { error: locErr?.message || "Location load failed" },
        { status: 500 }
      );
    }

    /* -----------------------------------
       Build pages
    ----------------------------------- */
    const inserts = locs.map((l) => {
      const state = Array.isArray(l.us_states) ? l.us_states[0] : l.us_states;

      return {
        location_id: l.id,
        state_id: l.state_id,
        title: `Porch Swings in ${l.city_name}, ${state.state_code}`,
        slug: `porch-swings-${l.slug}-${state.state_code.toLowerCase()}`,
        status,
        page_type,
        page_template,
        hero_image_url,
      };
    });

    /* -----------------------------------
       Insert / update pages safely
    ----------------------------------- */
    const { data: pages, error: insErr } = await supabaseAdmin
      .from("generated_pages")
      .upsert(inserts, { onConflict: "location_id,page_template" })
      .select("id");

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const pageIds = (pages ?? []).map((p) => p.id);

    /* -----------------------------------
       Load existing sections
    ----------------------------------- */
    const { data: existing } = await supabaseAdmin
      .from("generated_page_sections")
      .select("page_id")
      .in("page_id", pageIds);

    const existingSet = new Set((existing ?? []).map((e) => e.page_id));
    const newPageIds = pageIds.filter((id) => !existingSet.has(id));

    /* -----------------------------------
       Create sections only for new pages
    ----------------------------------- */
    const sectionRows = newPageIds.flatMap((page_id) => [
      {
        page_id,
        section_type: "hero",
        section_order: 1,
        content: {
          headline: "Custom Porch Swings Built for Your Area",
          subheadline: "Handcrafted. Built to last. Installed locally.",
          hero_image_url,
        },
      },
      {
        page_id,
        section_type: "content",
        section_order: 2,
        content: {
          body: "This page was automatically generated for customers in this city.",
        },
      },
      {
        page_id,
        section_type: "cta",
        section_order: 3,
        content: {
          button_url: "https://doorplaceusa.com/pages/get-a-fast-quote",
          button_text: "Get a Fast Quote",
        },
      },
    ]);

    if (sectionRows.length > 0) {
      const { error: secErr } = await supabaseAdmin
        .from("generated_page_sections")
        .insert(sectionRows);

      if (secErr) {
        return NextResponse.json({ error: secErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
  success: true,
  page_ids: pageIds,   // ← THIS is the fix
  created_count: newPageIds.length,
  skipped_count: pageIds.length - newPageIds.length,
});


  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
