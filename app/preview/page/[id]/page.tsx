import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import PorchSwingCityTemplate from "@/app/preview/templates/porchSwingCity";
import PorchSwingDeliveryCityTemplate from "@/app/preview/templates/porchSwingDeliveryCity";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewGeneratedPage({ params }: PageProps) {
  // Required in Next 15
  const { id } = await params;

  if (!id) notFound();

  const { data, error } = await supabaseAdmin
    .from("generated_pages")
    .select(
      `
      id,
      title,
      slug,
      status,
      page_template,
      created_at,
      hero_image_url,
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

  // Normalize joins
  const location = Array.isArray(data.us_locations)
    ? data.us_locations[0]
    : data.us_locations;

  const state = Array.isArray(location?.us_states)
    ? location.us_states[0]
    : location?.us_states;

  if (!location || !state) {
    notFound();
  }

  /* ------------------------------
     Template router
  ------------------------------ */

  // City pages
  if (data.page_template === "porch_swing_city") {
    return (
      <PorchSwingCityTemplate
        page={data}
        location={location}
        state={state}
      />
    );
  }

  // Delivery pages
  if (data.page_template === "porch_swing_delivery") {
    return (
      <PorchSwingDeliveryCityTemplate
        page={data}
        location={location}
        state={state}
      />
    );
  }

  // Unknown template
  notFound();
}
