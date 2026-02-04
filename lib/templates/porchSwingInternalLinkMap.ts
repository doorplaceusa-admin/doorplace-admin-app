// lib/templates/porchSwingInternalLinkMap.ts

/* =========================================
   TEMPLATE KEY UNION (MUST BE FIRST)
========================================= */

export type PorchSwingTemplateKey =
  | "porch_swing_city"
  | "porch_swing_installation_city"
  | "porch_swing_installation_process_city"
  | "porch_swing_cost_city"
  | "porch_swing_cost_factors_city"
  | "porch_swing_installed_cost_city"
  | "porch_swing_size_city"
  | "porch_swing_size_fit_city"
  | "porch_swing_clearance_city"
  | "porch_swing_ceiling_height_city"
  | "porch_swing_chain_spacing_city"
  | "porch_swing_style_city"
  | "porch_swing_material_city"
  | "porch_swing_mount_type_city"
  | "porch_swing_usecase_city";

/* =========================================
   INTERNAL LINK MAP
========================================= */

export const PORCH_SWING_INTERNAL_LINK_MAP: Record<
  PorchSwingTemplateKey,
  PorchSwingTemplateKey[]
> = {
  /* -----------------------------
     CORE / HUB
  ------------------------------ */

  porch_swing_city: [
    "porch_swing_installation_city",
    "porch_swing_cost_city",
    "porch_swing_size_city",
    "porch_swing_style_city",
  ],

  /* -----------------------------
     INSTALLATION
  ------------------------------ */

  porch_swing_installation_city: [
    "porch_swing_installation_process_city",
    "porch_swing_mount_type_city",
    "porch_swing_cost_city",
    "porch_swing_size_fit_city",
  ],

  porch_swing_installation_process_city: [
    "porch_swing_installation_city",
    "porch_swing_mount_type_city",
  ],

  porch_swing_mount_type_city: [
    "porch_swing_installation_city",
    "porch_swing_ceiling_height_city",
    "porch_swing_chain_spacing_city",
  ],

  /* -----------------------------
     COST
  ------------------------------ */

  porch_swing_cost_city: [
    "porch_swing_cost_factors_city",
    "porch_swing_installed_cost_city",
    "porch_swing_size_city",
    "porch_swing_installation_city",
  ],

  porch_swing_cost_factors_city: [
    "porch_swing_cost_city",
    "porch_swing_size_city",
  ],

  porch_swing_installed_cost_city: [
    "porch_swing_cost_city",
    "porch_swing_installation_city",
  ],

  /* -----------------------------
     SIZE & FIT
  ------------------------------ */

  porch_swing_size_city: [
    "porch_swing_size_fit_city",
    "porch_swing_clearance_city",
    "porch_swing_cost_city",
  ],

  porch_swing_size_fit_city: [
    "porch_swing_size_city",
    "porch_swing_installation_city",
  ],

  porch_swing_clearance_city: [
    "porch_swing_size_fit_city",
    "porch_swing_installation_city",
  ],

  porch_swing_ceiling_height_city: [
    "porch_swing_installation_city",
    "porch_swing_chain_spacing_city",
  ],

  porch_swing_chain_spacing_city: [
    "porch_swing_ceiling_height_city",
    "porch_swing_installation_city",
  ],

  /* -----------------------------
     STYLE / MATERIAL / USE CASE
  ------------------------------ */

  porch_swing_style_city: [
    "porch_swing_material_city",
    "porch_swing_size_city",
  ],

  porch_swing_material_city: [
    "porch_swing_style_city",
    "porch_swing_installation_city",
  ],

  porch_swing_usecase_city: [
    "porch_swing_style_city",
    "porch_swing_installation_city",
  ],
};
