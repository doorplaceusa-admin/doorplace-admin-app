import { buildHtmlFromSections } from "../renderers/buildHtmlFromSections";

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  mountType?: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingInstallationCityHTML({
  city,
  state,
  stateCode,
  slug,
  mountType,
  heroImageUrl,
}: RenderProps): string {
  const mountLabel = mountType
    ? mountType
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Porch Swing";

  const sections = [
    {
      section_type: "hero",
      content: {
        headline: `${mountLabel} Porch Swing Installation in ${city}, ${stateCode}`,
        subheadline: `Professional porch swing installation for homes in ${city}, ${state}.`,
        heroImageUrl,
      },
    },

    {
      section_type: "content",
      content: {
        body: `
Proper ${mountLabel.toLowerCase()} porch swing installation in ${city}, ${stateCode}
is critical for safety, comfort, and long-term performance.
Doorplace USA installs porch swings using reinforced mounting methods
designed for real-world outdoor structures.
        `,
      },
    },

    {
      section_type: "content",
      content: {
        body: `
Whether your swing is mounted to a ceiling, beam, pergola, or freestanding frame,
correct hardware placement and load support are essential.
Our team ensures every installation is secure, level, and built to handle everyday use.
        `,
      },
    },

    {
      section_type: "cta",
      content: {
        button_text: "Get a Fast Quote",
        button_url: "https://doorplaceusa.com/pages/get-a-fast-quote",
      },
    },
  ];

  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">
  ${buildHtmlFromSections(sections)}
</div>
`;
}
