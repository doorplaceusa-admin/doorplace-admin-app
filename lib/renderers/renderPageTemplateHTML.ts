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
};

/* =========================================
   Master Template Renderer
========================================= */

export function renderPageTemplateHTML(
  props: RenderPageTemplateProps
): string {
  const { page_template, ...templateProps } = props;

  switch (page_template) {
    case "porch_swing_city":
      return renderPorchSwingCityHTML(templateProps);

    case "porch_swing_delivery":
      return renderPorchSwingDeliveryCityHTML(templateProps);

    case "porch_swing_size_city":
      return renderPorchSwingSizeCityHTML(templateProps);

    case "porch_swing_material_city":
      return renderPorchSwingMaterialCityHTML(templateProps);

    case "porch_swing_style_city":
      return renderPorchSwingStyleCityHTML(templateProps);

    case "porch_swing_usecase_city":
      return renderPorchSwingUsecaseCityHTML(templateProps);

    default:
      throw new Error(
        `renderPageTemplateHTML: Unsupported page_template "${page_template}"`
      );
  }
}
