export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BATCH_SIZE = 150;

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/\s+/g, "-");
}

function titleCase(v: string) {
  return v
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function POST(req: Request) {
  const jobId = crypto.randomUUID();

  try {
    const {
      city_ids,
      page_template,
      hero_image_url = null,

      // 🔥 VARIANTS
      size,
      material,
      style,
      usecase,
      mountType, // 🔥 FIX: ACCEPT THIS
    } = await req.json();

    if (!Array.isArray(city_ids) || city_ids.length === 0) {
      return NextResponse.json({ error: "city_ids required" }, { status: 400 });
    }

    if (!page_template) {
      return NextResponse.json(
        { error: "page_template required" },
        { status: 400 }
      );
    }

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

      const { data: cities, error } = await supabaseAdmin
        .from("us_locations")
        .select(
          `
          id,
          city_name,
          slug,
          state_id,
          us_states:state_id ( state_code )
        `
        )
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
        let mount_type: string | null = null;

        switch (page_template) {
  /* -----------------------------
     PORCH SWING CORE
  ------------------------------ */

  case "porch_swing_city":
    title = `Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swings-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_delivery_city":
    title = `Porch Swing Delivery in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-delivery-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_installation_city":
    title = `${
      mountType
        ? `${titleCase(mountType)} Porch Swing Installation`
        : "Porch Swing Installation"
    } in ${c.city_name}, ${stateCodeUpper}`;

    slug = `porch-swing-installation-${c.slug}-${stateCodeLower}`;
    mount_type = mountType ?? null;
    variant_key = mountType ? slugify(mountType) : null;
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

  case "porch_swing_style_city":
    if (!style) throw new Error("Missing style");
    variant_key = slugify(style);
    title = `${titleCase(style)} Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-${variant_key}-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_usecase_city":
    if (!usecase) throw new Error("Missing usecase");
    variant_key = slugify(usecase);
    title = `${titleCase(usecase)} Porch Swings in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-${variant_key}-${c.slug}-${stateCodeLower}`;
    break;

  /* -----------------------------
     COST + PRICING TEMPLATES
  ------------------------------ */

  case "porch_swing_cost_city":
    title = `Porch Swing Cost in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-cost-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_cost_factors_city":
    title = `Porch Swing Cost Factors in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-cost-factors-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_cost_by_size_city":
    title = `Porch Swing Cost by Size in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-cost-by-size-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_installed_cost_city":
    title = `Installed Porch Swing Cost in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-installed-cost-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_vs_daybed_cost_city":
    title = `Porch Swing vs Daybed Cost in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-vs-daybed-cost-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_vs_rocker_cost_city":
    title = `Porch Swing vs Rocker Cost in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-vs-rocker-cost-${c.slug}-${stateCodeLower}`;
    break;

  /* -----------------------------
     DIY + PRO INSTALLATION
  ------------------------------ */

  case "porch_swing_diy_city":
    title = `DIY Porch Swing Installation in ${c.city_name}, ${stateCodeUpper}`;
    slug = `diy-porch-swing-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_hire_pro_city":
    title = `Hire a Pro to Install a Porch Swing in ${c.city_name}, ${stateCodeUpper}`;
    slug = `hire-pro-porch-swing-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_installation_process_city":
    title = `Porch Swing Installation Process in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-installation-process-${c.slug}-${stateCodeLower}`;
    break;

  /* -----------------------------
     HARDWARE + SUPPORT
  ------------------------------ */

  case "porch_swing_hardware_city":
    title = `Porch Swing Hardware in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-hardware-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_support_city":
    title = `Porch Swing Support Requirements in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-support-${c.slug}-${stateCodeLower}`;
    break;

  /* -----------------------------
     MEASUREMENTS + ENGINEERING
  ------------------------------ */

  case "porch_swing_beam_size_city":
    title = `Porch Swing Beam Size Requirements in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-beam-size-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_ceiling_height_city":
    title = `Porch Swing Ceiling Height Guide in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-ceiling-height-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_chain_spacing_city":
    title = `Porch Swing Chain Spacing Guide in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-chain-spacing-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_clearance_city":
    title = `Porch Swing Clearance Requirements in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-clearance-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_hang_height_city":
    title = `Porch Swing Hanging Height Guide in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-hang-height-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_mount_type_city":
    title = `Porch Swing Mount Type Guide in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-mount-type-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_weight_capacity_city":
    title = `Porch Swing Weight Capacity Guide in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-weight-capacity-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_width_for_swing_city":
    title = `Porch Width Needed for a Swing in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-width-for-swing-${c.slug}-${stateCodeLower}`;
    break;

  case "what_size_porch_swing_city":
    title = `What Size Porch Swing Should You Get in ${c.city_name}, ${stateCodeUpper}`;
    slug = `what-size-porch-swing-${c.slug}-${stateCodeLower}`;
    break;

  /* -----------------------------
     SMALL + SPECIAL TYPES
  ------------------------------ */

  case "porch_swing_small_porch_city":
    title = `Porch Swings for Small Porches in ${c.city_name}, ${stateCodeUpper}`;
    slug = `small-porch-swings-${c.slug}-${stateCodeLower}`;
    break;

  case "porch_swing_style_fit_city":
    title = `Porch Swing Style Fit Guide in ${c.city_name}, ${stateCodeUpper}`;
    slug = `porch-swing-style-fit-${c.slug}-${stateCodeLower}`;
    break;

  /* -----------------------------
     DOOR TEMPLATES
  ------------------------------ */

  case "door_city":
    if (style) {
      variant_key = slugify(style);
      title = `${titleCase(style)} in ${c.city_name}, ${stateCodeUpper}`;
      slug = `${variant_key}-${c.slug}-${stateCodeLower}`;
    } else {
      title = `Custom Wood Doors in ${c.city_name}, ${stateCodeUpper}`;
      slug = `wood-doors-${c.slug}-${stateCodeLower}`;
    }
    break;

  case "custom_door_installation_city":
    title = `Custom Door Installation in ${c.city_name}, ${stateCodeUpper}`;
    slug = `custom-door-installation-${c.slug}-${stateCodeLower}`;
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
          mount_type, // 🔥 STORED
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

    return NextResponse.json({ success: true, job_id: jobId });
  } catch (err: any) {
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
