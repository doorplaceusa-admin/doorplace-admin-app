type BuildMetaDescriptionArgs = {
  pageType:
    | "material"
    | "size"
    | "door"
    | "install"
    | "delivery"
    | "general";
  city: string;
  stateCode: string;
  material?: string | null;
  size?: string | null;
};

const BRAND_LINE =
  "Built by Doorplace USA with quality craftsmanship and nationwide delivery.";

function trim160(str: string) {
  return str.length > 160 ? str.slice(0, 157) + "…" : str;
}

export function buildMetaDescription({
  pageType,
  city,
  stateCode,
  material,
  size,
}: BuildMetaDescriptionArgs): string {
  let description = "";

  switch (pageType) {
    case "material":
      description = `Custom ${material} porch swings in ${city}, ${stateCode}. Durable, outdoor-ready designs made for comfort and long-term use. ${BRAND_LINE}`;
      break;

    case "size":
      description = `Custom ${size} porch swings in ${city}, ${stateCode}. Built for strength, comfort, and everyday outdoor living. ${BRAND_LINE}`;
      break;

    case "door":
      description = `Custom wood doors in ${city}, ${stateCode}. Designed for beauty, security, and long-term performance. ${BRAND_LINE}`;
      break;

    case "install":
    case "delivery":
      description = `Professional porch swing delivery and installation in ${city}, ${stateCode}. Expert service by Doorplace USA.`;
      break;

    case "general":
    default:
      description = `Custom wood craftsmanship in ${city}, ${stateCode}. Porch swings, doors, and outdoor products by Doorplace USA.`;
      break;
  }

  return trim160(description);
}
