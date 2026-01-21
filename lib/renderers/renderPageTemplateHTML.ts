// lib/renderers/renderPageTemplateHTML.ts

import { renderPorchSwingCityHTML } from "../templates/renderPorchSwingCityHTML";
import { renderPorchSwingDeliveryCityHTML } from "../templates/renderPorchSwingDeliveryCityHTML";
import { renderPorchSwingSizeCityHTML } from "../templates/renderPorchSwingSizeCityHTML";
import { renderPorchSwingMaterialCityHTML } from "../templates/renderPorchSwingMaterialCityHTML";
import { renderPorchSwingStyleCityHTML } from "../templates/renderPorchSwingStyleCityHTML";
import { renderPorchSwingUsecaseCityHTML } from "../templates/renderPorchSwingUsecaseCityHTML";

/* =========================================
   Types
========================================= */

export type RenderPageTemplateProps = {
  page_template: string;

  city: string;
  state: string;
  stateCode: string;
  slug: string;

  heroImageUrl?: string | null;

  // 🔥 REQUIRED FOR VARIANT TEMPLATES
  variant_key?: string | null;
};

/* =========================================
   Master Template Renderer
========================================= */

export function renderPageTemplateHTML(
  props: RenderPageTemplateProps
): string {
  const {
    page_template,
    variant_key,
    city,
    state,
    stateCode,
    slug,
    heroImageUrl,
  } = props;

  switch (page_template) {
    case "porch_swing_city":
      return renderPorchSwingCityHTML({
        city,
        state,
        stateCode,
        slug,
        heroImageUrl,
      });

    case "porch_swing_delivery":
      return renderPorchSwingDeliveryCityHTML({
        city,
        state,
        stateCode,
        slug,
        heroImageUrl,
      });

    case "porch_swing_size_city":
      if (!variant_key) {
        throw new Error("Size template requires variant_key");
      }

      return renderPorchSwingSizeCityHTML({
        city,
        state,
        stateCode,
        slug,
        heroImageUrl,
        size: variant_key,
      });

    case "porch_swing_material_city":
      if (!variant_key) {
        throw new Error("Material template requires variant_key");
      }

      return renderPorchSwingMaterialCityHTML({
        city,
        state,
        stateCode,
        slug,
        heroImageUrl,
        material: variant_key,
      });

    case "porch_swing_style_city":
      if (!variant_key) {
        throw new Error("Style template requires variant_key");
      }

      return renderPorchSwingStyleCityHTML({
        city,
        state,
        stateCode,
        slug,
        heroImageUrl,
        style: variant_key,
      });

    case "porch_swing_usecase_city":
      if (!variant_key) {
        throw new Error("Usecase template requires variant_key");
      }

      return renderPorchSwingUsecaseCityHTML({
        city,
        state,
        stateCode,
        slug,
        heroImageUrl,
        usecase: variant_key,
      });

    default:
      throw new Error(
        `renderPageTemplateHTML: Unsupported page_template "${page_template}"`
      );
  }
}
