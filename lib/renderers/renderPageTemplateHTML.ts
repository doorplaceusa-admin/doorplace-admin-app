// lib/renderers/renderPageTemplateHTML.ts

/* =========================================
   PORCH SWING IMPORTS
========================================= */

import { renderPorchSwingCityHTML } from "../templates/renderPorchSwingCityHTML";
import { renderPorchSwingDeliveryCityHTML } from "../templates/renderPorchSwingDeliveryCityHTML";

import { renderPorchSwingInstallationCityHTML } from "../templates/renderPorchSwingInstallationCityHTML";
import { renderPorchSwingInstallationProcessCityHTML } from "../templates/renderPorchSwingInstallationProcessCityHTML";

import { renderPorchSwingCostCityHTML } from "../templates/renderPorchSwingCostCityHTML";
import { renderPorchSwingCostFactorsCityHTML } from "../templates/renderPorchSwingCostFactorsCityHTML";
import { renderPorchSwingInstalledCostCityHTML } from "../templates/renderPorchSwingInstalledCostCityHTML";
import { renderPorchSwingCostBySizeCityHTML } from "../templates/renderPorchSwingCostBySizeCityHTML";
import { renderPorchSwingVsDaybedCostCityHTML } from "../templates/renderPorchSwingVsDaybedCostCityHTML";
import { renderPorchSwingVsRockerCostCityHTML } from "../templates/renderPorchSwingVsRockerCostCityHTML";

import { renderPorchSwingSizeCityHTML } from "../templates/renderPorchSwingSizeCityHTML";
import { renderPorchSwingSizeFitCityHTML } from "../templates/renderPorchSwingSizeFitCityHTML";
import { renderPorchSwingClearanceCityHTML } from "../templates/renderPorchSwingClearanceCityHTML";
import { renderPorchSwingCeilingHeightCityHTML } from "../templates/renderPorchSwingCeilingHeightCityHTML";
import { renderPorchSwingChainSpacingCityHTML } from "../templates/renderPorchSwingChainSpacingCityHTML";
import { renderPorchDepthForSwingCityHTML } from "../templates/renderPorchDepthForSwingCityHTML";
import { renderPorchWidthForSwingCityHTML } from "../templates/renderPorchWidthForSwingCityHTML";
import { renderWhatSizePorchSwingCityHTML } from "../templates/renderWhatSizePorchSwingCityHTML";

import { renderPorchSwingMaterialCityHTML } from "../templates/renderPorchSwingMaterialCityHTML";
import { renderPorchSwingStyleCityHTML } from "../templates/renderPorchSwingStyleCityHTML";
import { renderPorchSwingUsecaseCityHTML } from "../templates/renderPorchSwingUsecaseCityHTML";
import { renderPorchSwingMountTypeCityHTML } from "../templates/renderPorchSwingMountTypeCityHTML";
import { renderPorchSwingSmallPorchCityHTML } from "../templates/renderPorchSwingSmallPorchCityHTML";

import { renderPorchSwingDIYCityHTML } from "../templates/renderPorchSwingDIYCityHTML";
import { renderPorchSwingHardwareCityHTML } from "../templates/renderPorchSwingHardwareCityHTML";
import { renderPorchSwingHireProCityHTML } from "../templates/renderPorchSwingHireProCityHTML";
import { renderPorchSwingWeightCapacityCityHTML } from "../templates/renderPorchSwingWeightCapacityCityHTML";

/* =========================================
   DOOR IMPORTS
========================================= */

import { renderBarnDoorStyleCityHTML } from "../templates/renderBarnDoorStyleCityHTML";
import { renderCustomDoorInstallationCityHTML } from "../templates/renderCustomDoorInstallationCityHTML";
import { renderInteriorDoorInstallationCityHTML } from "../templates/renderInteriorDoorInstallationCityHTML";

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
  variant_key?: string | null;
  mountType?: "ceiling" | "beam" | "pergola" | "freestanding" | null;
};

/* =========================================
   Master Renderer
========================================= */

export function renderPageTemplateHTML(
  props: RenderPageTemplateProps
): string {
  const { page_template, variant_key, mountType } = props;

  switch (page_template) {
    /* -----------------------------
       DOORS
    ------------------------------ */

    case "door_city":
      if (!variant_key) throw new Error("door_city requires variant_key");
      return renderBarnDoorStyleCityHTML({ ...props, style: variant_key });

    case "custom_door_installation_city":
      return renderCustomDoorInstallationCityHTML(props);

    case "interior_door_installation_city":
      return renderInteriorDoorInstallationCityHTML(props);

    /* -----------------------------
       CORE
    ------------------------------ */

    case "porch_swing_city":
      return renderPorchSwingCityHTML(props);

    case "porch_swing_delivery":
      return renderPorchSwingDeliveryCityHTML(props);

    /* -----------------------------
       INSTALLATION
    ------------------------------ */

    case "porch_swing_installation_city":
      return renderPorchSwingInstallationCityHTML({
        ...props,
        mountType:
          mountType === "beam" || mountType === "pergola"
            ? mountType
            : "ceiling",
      });

    case "porch_swing_installation_process_city":
      return renderPorchSwingInstallationProcessCityHTML(props);

    /* -----------------------------
       COST
    ------------------------------ */

    case "porch_swing_cost_city":
      return renderPorchSwingCostCityHTML(props);

    case "porch_swing_cost_factors_city":
      return renderPorchSwingCostFactorsCityHTML(props);

    case "porch_swing_installed_cost_city":
      return renderPorchSwingInstalledCostCityHTML(props);

    case "porch_swing_cost_by_size_city":
      return renderPorchSwingCostBySizeCityHTML(props);

    case "porch_swing_vs_daybed_cost_city":
      return renderPorchSwingVsDaybedCostCityHTML(props);

    case "porch_swing_vs_rocker_cost_city":
      return renderPorchSwingVsRockerCostCityHTML(props);

    /* -----------------------------
       SIZE / FIT
    ------------------------------ */

    case "porch_swing_size_city":
      if (!variant_key) throw new Error("size required");
      return renderPorchSwingSizeCityHTML({
        ...props,
        size: variant_key,
      });

    case "porch_swing_size_fit_city":
      return renderPorchSwingSizeFitCityHTML(props);

    case "porch_swing_clearance_city":
      return renderPorchSwingClearanceCityHTML(props);

    case "porch_swing_ceiling_height_city":
      return renderPorchSwingCeilingHeightCityHTML(props);

    case "porch_swing_chain_spacing_city":
      return renderPorchSwingChainSpacingCityHTML(props);

    case "porch_swing_depth_city":
      return renderPorchDepthForSwingCityHTML(props);

    case "porch_swing_width_city":
      return renderPorchWidthForSwingCityHTML(props);

    case "what_size_porch_swing_city":
      return renderWhatSizePorchSwingCityHTML(props);

    /* -----------------------------
       VARIANTS
    ------------------------------ */

    case "porch_swing_material_city":
      if (!variant_key) throw new Error("material required");
      return renderPorchSwingMaterialCityHTML({
        ...props,
        material: variant_key,
      });

    case "porch_swing_style_city":
      if (!variant_key) throw new Error("style required");
      return renderPorchSwingStyleCityHTML({
        ...props,
        style: variant_key,
      });

    case "porch_swing_usecase_city":
      if (!variant_key) throw new Error("usecase required");
      return renderPorchSwingUsecaseCityHTML({
        ...props,
        usecase: variant_key,
      });

    case "porch_swing_mount_type_city":
      return renderPorchSwingMountTypeCityHTML({
        ...props,
        mountType:
          props.mountType === "beam" || props.mountType === "pergola"
            ? props.mountType
            : "ceiling",
      });

    case "porch_swing_small_porch_city":
      return renderPorchSwingSmallPorchCityHTML(props);

    /* -----------------------------
       DIY / PRO
    ------------------------------ */

    case "porch_swing_diy_city":
      return renderPorchSwingDIYCityHTML(props);

    case "porch_swing_hardware_city":
      return renderPorchSwingHardwareCityHTML(props);

    case "porch_swing_hire_pro_city":
      return renderPorchSwingHireProCityHTML(props);

    case "porch_swing_weight_capacity_city":
      return renderPorchSwingWeightCapacityCityHTML(props);

    default:
      throw new Error(`Unsupported page_template: ${page_template}`);
  }
}