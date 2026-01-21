export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BATCH_SIZE = 150;

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/\s+/g, "-");
}

function titleCase(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export async function POST(req: Request) {
  const jobId = crypto.randomUUID();

  try {
    const {
      city_ids,
      page_template,
      hero_image_url = null,
      size,
      material,
      style,
      usecase,
    } = await req.json();

    if (!Array.isArray(city_ids) || city_ids.length === 0) {
      return NextResponse.json({ error: "city_ids required" }, { status: 400 });
    }

    if (!page_template) {
      return NextResponse.json({ error: "page_template required" }, { status: 400 });
    }

    console.log("🚀 GENERATION STARTED");
    console.log("📦 Cities:", city_ids.length);
    console.log("📄 Template:", page_template);

    await supabaseAdmin.from("page_generation_jobs").insert({
      id: jobId,
      total: city_ids.length,
      status: "running",
    });

    const totalBatches = Math.ceil(city_ids.length / BATCH_SIZE);
    let processed = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = city_ids.slice(
        batchIndex * BATCH_SIZE,
        (batchIndex + 1) * BATCH_SIZE
      );

      console.log(
        `📦 Batch ${batchIndex + 1}/${totalBatches} — ${batch.length} cities`
      );

      const { data: cities, error } = await supabaseAdmin
        .from("us_locations")
        .select(`
          id,
          city_name,
          slug,
          state_id,
          us_states:state_id ( state_code )
        `)
        .in("id", batch);

      if (error || !cities) {
        throw new Error("Failed loading city batch");
      }

      const inserts = cities.map((c: any) => {
        const st = Array.isArray(c.us_states) ? c.us_states[0] : c.us_states;
        const stateCodeLower = st?.state_code?.toLowerCase() || "";
        const stateCodeUpper = stateCodeLower.toUpperCase();

        let title = "";
        let slug = "";
        let variant_key: string | null = null;

        switch (page_template) {
          case "porch_swing_city":
            title = `Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
            slug = `porch-swings-${c.slug}-${stateCodeLower}`;
            break;

          case "porch_swing_delivery":
            title = `Porch Swing Delivery in ${c.city_name}, ${stateCodeUpper}`;
            slug = `porch-swing-delivery-${c.slug}-${stateCodeLower}`;
            break;

          case "porch_swing_size_city":
            if (!size) throw new Error("Missing size");
            variant_key = slugify(size);
            title = `${titleCase(size)} Porch Swing Sizes in ${c.city_name}, ${stateCodeUpper}`;
            slug = `porch-swing-${variant_key}-${c.slug}-${stateCodeLower}`;
            break;

          case "porch_swing_material_city":
            if (!material) throw new Error("Missing material");
            variant_key = slugify(material);
            title = `${titleCase(material)} Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
            slug = `porch-swing-${variant_key}-${c.slug}-${stateCodeLower}`;
            break;

          case "porch_swing_usecase_city":
            if (!usecase) throw new Error("Missing usecase");
            variant_key = slugify(usecase);
            title = `${titleCase(usecase)} Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
            slug = `porch-swing-${variant_key}-${c.slug}-${stateCodeLower}`;
            break;

          case "porch_swing_style_city":
            if (!style) throw new Error("Missing style");
            variant_key = slugify(style);
            title = `${titleCase(style)} Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
            slug = `porch-swing-${variant_key}-${c.slug}-${stateCodeLower}`;
            break;

          case "door_city":
            title = `Custom Wood Doors in ${c.city_name}, ${stateCodeUpper}`;
            slug = `wood-doors-${c.slug}-${stateCodeLower}`;
            break;

          default:
            throw new Error(`Unsupported template: ${page_template}`);
        }

        return {
          location_id: c.id,
          state_id: c.state_id,
          title,
          slug,
          status: "generated",
          page_type: "city",
          page_template,
          variant_key,
          hero_image_url,
          shopify_page_id: null,
        };
      });

      await supabaseAdmin.from("generated_pages").insert(inserts);

      processed += inserts.length;

      await supabaseAdmin
        .from("page_generation_jobs")
        .update({
          processed,
          last_batch: batchIndex + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    await supabaseAdmin
      .from("page_generation_jobs")
      .update({ status: "completed" })
      .eq("id", jobId);

    console.log("🎉 GENERATION COMPLETE");

    return NextResponse.json({
      success: true,
      job_id: jobId,
    });

  } catch (err: any) {
    console.error("❌ GENERATION FAILED:", err);

    await supabaseAdmin
      .from("page_generation_jobs")
      .update({
        status: "failed",
        error: err.message,
      })
      .eq("id", jobId);

    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}
