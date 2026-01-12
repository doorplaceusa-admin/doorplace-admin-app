export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* =============================
   VALID PAGE TEMPLATES
============================= */
const VALID_TEMPLATES = [
  "porch_swing_city",
  "porch_swing_delivery",
] as const;

type PageTemplate = (typeof VALID_TEMPLATES)[number];

const CHUNK_SIZE = 500;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const state_id: string | null = body.state_id || null;
    const page_template: PageTemplate = body.page_template || "porch_swing_city";
    const status = body.status || "draft";
    const hero_image_url: string | null = body.hero_image_url || null;

    if (!state_id) {
      return NextResponse.json({ error: "state_id required" }, { status: 400 });
    }

    if (!VALID_TEMPLATES.includes(page_template)) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    const isDelivery = page_template === "porch_swing_delivery";

    /* ---------------------------------
       Load all cities for the state
    ---------------------------------- */
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
      return NextResponse.json(
        { error: error?.message || "City load failed" },
        { status: 500 }
      );
    }

    const results: string[] = [];

    for (let i = 0; i < cities.length; i += CHUNK_SIZE) {
      const batch = cities.slice(i, i + CHUNK_SIZE);

      const inserts = batch.map((l) => {
        const st = Array.isArray(l.us_states) ? l.us_states[0] : l.us_states;
        const stateCode = st?.state_code?.toLowerCase() || "";

        /* ----------------------------
           Slug Logic (locked to template)
        ----------------------------- */
        const baseSlug = isDelivery
          ? `porch-swing-delivery-${l.slug}-${stateCode}`
          : `porch-swing-city-${l.slug}-${stateCode}`;

        /* ----------------------------
           Title Logic (locked to template)
        ----------------------------- */
        const title = isDelivery
          ? `Porch Swing Delivery in ${l.city_name}, ${stateCode.toUpperCase()}`
          : `Porch Swing City in ${l.city_name}, ${stateCode.toUpperCase()}`;

        return {
          location_id: l.id,
          state_id: l.state_id,
          title,
          slug: baseSlug,
          status,
          page_type: "city",
          page_template,
          hero_image_url,
          shopify_pushed: false,
        };
      });

      const { data: pages, error: insertErr } = await supabaseAdmin
        .from("generated_pages")
        .upsert(inserts, {
          onConflict: "slug",
          ignoreDuplicates: true,
        })
        .select("id");

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      if (pages) {
        results.push(...pages.map((p) => p.id));
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      page_ids: results,
      state_id,
      page_template,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
