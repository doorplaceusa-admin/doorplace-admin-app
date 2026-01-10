export function buildHtmlFromSections(sections: any[]) {
  if (!Array.isArray(sections)) return "";

  return sections
    .map((section) => {
      switch (section.section_type) {
        case "hero":
          return `
            <section>
              <h1>${section.content.headline}</h1>
              <p>${section.content.subheadline}</p>
            </section>
          `;

        case "content":
          return `
            <section>
              <p>${section.content.body}</p>
            </section>
          `;

        case "map":
          return `
            <section>
              <div style="height:300px;background:#eee;">
                Map placeholder (zoom ${section.content.zoom})
              </div>
            </section>
          `;

        case "cta":
          return `
            <section>
              <a href="${section.content.button_url}">
                ${section.content.button_text}
              </a>
            </section>
          `;

        default:
          return "";
      }
    })
    .join("\n");
}
