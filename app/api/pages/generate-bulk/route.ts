export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* =============================
   VALID PAGE TEMPLATES
============================= */
const VALID_TEMPLATES = [
  "porch_swing_city",
  "porch_swing_delivery",
  "porch_swing_size_city",
  "porch_swing_usecase_city",
  "porch_swing_material_city",
  "porch_swing_style_city",
] as const;

type PageTemplate = (typeof VALID_TEMPLATES)[number];

const CHUNK_SIZE = 500;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      state_id,
      page_template = "porch_swing_city",
      status = "draft",
      hero_image_url = null,
      size,
      usecase,
      material,
      style,
    } = body;

    if (!state_id) {
      return NextResponse.json({ error: "state_id required" }, { status: 400 });
    }

    if (!VALID_TEMPLATES.includes(page_template)) {
      return NextResponse.json({ error: "Invalid page_template" }, { status: 400 });
    }

    /* -------------------------
       Template field validation
    ------------------------- */
    if (page_template === "porch_swing_size_city" && !size) {
      return NextResponse.json({ error: "size required for size template" }, { status: 400 });
    }

    if (page_template === "porch_swing_usecase_city" && !usecase) {
      return NextResponse.json({ error: "usecase required for usecase template" }, { status: 400 });
    }

    if (page_template === "porch_swing_material_city" && !material) {
      return NextResponse.json({ error: "material required for material template" }, { status: 400 });
    }

    if (page_template === "porch_swing_style_city" && !style) {
      return NextResponse.json({ error: "style required for style template" }, { status: 400 });
    }

    /* -------------------------
       Load cities
    ------------------------- */
    const { data: cities, error } = await supabaseAdmin
      .from("us_locations")
      .select(`
        id,
        city_name,
        slug,
        state_id,
        us_states:state_id ( state_code )
      `)
      .eq("state_id", state_id);

    if (error || !cities) {
      return NextResponse.json({ error: "City load failed" }, { status: 500 });
    }

    const results: string[] = [];

    for (let i = 0; i < cities.length; i += CHUNK_SIZE) {
      const batch = cities.slice(i, i + CHUNK_SIZE);

      const inserts = batch.map((l) => {
        const st = Array.isArray(l.us_states) ? l.us_states[0] : l.us_states;
        const stateCode = st?.state_code?.toLowerCase() || "";
        const STATE = stateCode.toUpperCase();

        let slug = "";
        let title = "";

        switch (page_template) {
          case "porch_swing_city":
            slug = `porch-swing-${l.slug}-${stateCode}`;
            title = `Porch Swings in ${l.city_name}, ${STATE}`;
            break;

          case "porch_swing_delivery":
            slug = `porch-swing-delivery-${l.slug}-${stateCode}`;
            title = `Porch Swing Delivery in ${l.city_name}, ${STATE}`;
            break;

          case "porch_swing_size_city":
            slug = `porch-swing-${size}-${l.slug}-${stateCode}`;
            title = `${capitalize(size)} Porch Swings in ${l.city_name}, ${STATE}`;
            break;

          case "porch_swing_usecase_city":
            slug = `porch-swing-${usecase}-${l.slug}-${stateCode}`;
            title = `${capitalize(usecase)} Porch Swings in ${l.city_name}, ${STATE}`;
            break;

          case "porch_swing_material_city":
            slug = `porch-swing-${material}-${l.slug}-${stateCode}`;
            title = `${capitalize(material)} Porch Swings in ${l.city_name}, ${STATE}`;
            break;

          case "porch_swing_style_city":
            slug = `porch-swing-${style}-${l.slug}-${stateCode}`;
            title = `${capitalize(style)} Porch Swings in ${l.city_name}, ${STATE}`;
            break;
        }

        return {
          location_id: l.id,
          state_id: l.state_id,
          title,
          slug,
          status,
          page_type: "city",
          page_template,
          hero_image_url,
          shopify_pushed: false,
        };
      });

      const { data: pages, error: insertErr } = await supabaseAdmin
        .from("generated_pages")
        .upsert(inserts, { onConflict: "slug", ignoreDuplicates: true })
        .select("id");

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      if (pages) results.push(...pages.map((p) => p.id));
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      page_ids: results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* -------------------------
   Helpers
------------------------- */
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
