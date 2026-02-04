import { buildPorchSwingInternalLinks } from "lib/templates/porchSwingInternalLinks";
import { PorchSwingTemplateKey } from "lib/templates/porchSwingInternalLinkMap";

type RenderProps = {
  currentTemplate: PorchSwingTemplateKey;
  city: string;
  state: string;
  stateCode: string;
  slug: string;
};

export function renderPorchSwingInternalLinksHTML({
  currentTemplate,
  city,
  state,
  stateCode,
  slug,
}: RenderProps): string {
  const links = buildPorchSwingInternalLinks(currentTemplate, {
    city,
    state,
    stateCode,
    slug,
  });

  if (!links.length) return "";

  return `
<div style="margin-top:40px;border-top:1px solid #e5e5e5;padding-top:24px;">
  <h3 style="color:#b80d0d;font-size:22px;margin-bottom:12px;">
    Related Porch Swing Guides for ${city}, ${stateCode}
  </h3>
  <ul style="line-height:1.9;font-size:16px;">
    ${links
      .map(
        l =>
          `<li>
            <a href="${l.url}" style="color:#b80d0d;text-decoration:none;">
              ${l.label} in ${city}, ${stateCode}
            </a>
          </li>`
      )
      .join("")}
  </ul>
</div>
`;
}
