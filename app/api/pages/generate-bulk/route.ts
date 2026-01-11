import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const location_ids: string[] = body.location_ids ?? body.city_ids ?? [];
    const page_template: string = body.page_template || "porch_swing_city";
    const page_type: string = body.page_type || "city";
    const status: string = body.status || "draft";
    const hero_image_url: string | null = body.hero_image_url || null;

    if (!Array.isArray(location_ids) || location_ids.length === 0) {
      return NextResponse.json({ error: "location_ids required" }, { status: 400 });
    }

    // Load cities + states
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

    const isDelivery = (tpl: string) => tpl === "porch_swing_delivery";

    // Build inserts with correct title + slug PER TEMPLATE
    const inserts = locs.map((l: any) => {
      const st = Array.isArray(l.us_states) ? l.us_states[0] : l.us_states;
      const stateCodeLower = (st?.state_code || "").toLowerCase();

      const title = isDelivery(page_template)
        ? `Porch Swing Delivery in ${l.city_name}, ${st.state_code}`
        : `Porch Swings in ${l.city_name}, ${st.state_code}`;

      const slug = isDelivery(page_template)
        ? `porch-swing-delivery-${l.slug}-${stateCodeLower}`
        : `porch-swings-${l.slug}-${stateCodeLower}`;

      return {
        location_id: l.id,
        state_id: l.state_id,
        title,
        slug,
        status,
        page_type,
        page_template,     // <-- THIS is what push-to-shopify reads
        hero_image_url,
      };
    });

    // Upsert pages (template-specific uniqueness)
    const { data: pages, error: insErr } = await supabaseAdmin
      .from("generated_pages")
      .upsert(inserts, { onConflict: "location_id,page_template" })
      .select("id,page_template");

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const pageIds = (pages ?? []).map((p: any) => p.id);

    return NextResponse.json({
      success: true,
      page_ids: pageIds,
      page_template_used: page_template, // quick debug visibility
      created_count: pageIds.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
