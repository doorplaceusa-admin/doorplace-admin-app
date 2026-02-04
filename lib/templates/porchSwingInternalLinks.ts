import {
  PorchSwingTemplateKey,
  PORCH_SWING_INTERNAL_LINK_MAP,
} from "./porchSwingInternalLinkMap";

type CityContext = {
  city: string;
  state: string;
  stateCode: string;
  slug: string; // city-state slug you already use everywhere
};

/**
 * Maps template keys → URL paths
 * IMPORTANT: these paths must match your TradePilot routing
 */
function templateKeyToPath(
  key: PorchSwingTemplateKey,
  slug: string
): string {
  switch (key) {
    case "installation":
      return `/pages/porch-swing-installation-${slug}`;
    case "installation_mount":
      return `/pages/how-to-hang-a-porch-swing-${slug}`;
    case "cost":
      return `/pages/porch-swing-cost-${slug}`;
    case "cost_factors":
      return `/pages/what-affects-porch-swing-cost-${slug}`;
    case "cost_by_size":
      return `/pages/porch-swing-cost-by-size-${slug}`;
    case "cost_compare":
      return `/pages/porch-swing-vs-daybed-cost-${slug}`;
    case "size_clearance":
      return `/pages/porch-swing-clearance-${slug}`;
    case "size_fit":
      return `/pages/what-size-porch-swing-fits-${slug}`;
    case "size_depth":
      return `/pages/porch-depth-for-porch-swing-${slug}`;
    case "size_width":
      return `/pages/porch-width-for-porch-swing-${slug}`;
    case "size_ceiling":
      return `/pages/porch-swing-ceiling-height-${slug}`;
    case "size_small_porch":
      return `/pages/can-a-porch-swing-fit-on-small-porch-${slug}`;
    default:
      return "";
  }
}

/**
 * Generates internal links for a given template
 */
export function buildPorchSwingInternalLinks(
  currentTemplate: PorchSwingTemplateKey,
  ctx: CityContext
): { label: string; url: string }[] {
  const linkedTemplates = PORCH_SWING_INTERNAL_LINK_MAP[currentTemplate] || [];

  return linkedTemplates.map(key => ({
    label: humanizeTemplateKey(key),
    url: templateKeyToPath(key, ctx.slug),
  }));
}

/**
 * Human-readable link labels
 */
function humanizeTemplateKey(key: PorchSwingTemplateKey): string {
  switch (key) {
    case "installation":
      return "Porch Swing Installation";
    case "installation_mount":
      return "How to Hang a Porch Swing";
    case "cost":
      return "Porch Swing Cost";
    case "cost_factors":
      return "What Affects Porch Swing Cost";
    case "cost_by_size":
      return "Porch Swing Cost by Size";
    case "cost_compare":
      return "Porch Swing vs Daybed Cost";
    case "size_clearance":
      return "Porch Swing Clearance";
    case "size_fit":
      return "What Size Porch Swing Fits";
    case "size_depth":
      return "Porch Depth for Porch Swing";
    case "size_width":
      return "Porch Width for Porch Swing";
    case "size_ceiling":
      return "Porch Swing Ceiling Height";
    case "size_small_porch":
      return "Small Porch Swing Options";
    default:
      return "Related Porch Swing Info";
  }
}
