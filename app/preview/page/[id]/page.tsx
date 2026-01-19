import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";

// Templates
import PorchSwingCityTemplate from "@/app/preview/templates/porchSwingCity";
import PorchSwingDeliveryCityTemplate from "@/app/preview/templates/porchSwingDeliveryCity";

/* =========================================
   Types
========================================= */
type PageProps = {
  params: {
    id: string;
  };
};

/* =========================================
   Preview Page
========================================= */
export default async function PreviewGeneratedPage({ params }: PageProps) {
  const { id } = params;

  if (!id) notFound();

  /* ---------------------------------------
     Load generated page + joins
  --------------------------------------- */
  const { data, error } = await supabaseAdmin
    .from("generated_pages")
    .select(
      `
      id,
      title,
      slug,
      status,
      page_template,
      hero_image_url,
      created_at,
      us_locations (
        id,
        city_name,
        slug,
        us_states (
          id,
          state_name,
          state_code
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Preview load error:", error);
    notFound();
  }

  /* ---------------------------------------
     Normalize joins
  --------------------------------------- */
  const location = Array.isArray(data.us_locations)
    ? data.us_locations[0]
    : data.us_locations;

  const state = Array.isArray(location?.us_states)
    ? location.us_states[0]
    : location?.us_states;

  if (!location || !state) {
    console.error("Preview missing location/state", { location, state });
    notFound();
  }

  /* ---------------------------------------
     Template router
  --------------------------------------- */
  switch (data.page_template) {
    case "porch_swing_city":
    case "porch_swing_size_city":
    case "porch_swing_material_city":
    case "porch_swing_style_city":
    case "porch_swing_usecase_city":
      return (
        <PorchSwingCityTemplate
          page={data}
          location={location}
          state={state}
        />
      );

    case "porch_swing_delivery_city":
      return (
        <PorchSwingDeliveryCityTemplate
          page={data}
          location={location}
          state={state}
        />
      );

    default:
      console.warn("Unknown page_template:", data.page_template);
      notFound();
  }
}
