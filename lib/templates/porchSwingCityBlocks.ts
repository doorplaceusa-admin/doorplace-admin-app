type PorchSwingCityInput = {
  city: string;
  state: string;
  stateCode: string;
};

export function getPorchSwingCityBlocks({ city, state, stateCode }: PorchSwingCityInput) {
  return [
    {
      type: "hero",
      headline: `Porch Swings in ${city}, ${stateCode}`,
      subtext: `Custom handcrafted porch swings built for homes in ${city}, ${state}.`,
    },

    {
      type: "intro",
      body: `Doorplace USA builds heavy-duty wooden porch swings designed for real outdoor living in ${city}. Each swing is handcrafted, reinforced, and built to last in the ${state} climate.`,
    },

    {
      type: "features",
      items: [
        "Solid wood construction",
        "Crib, Twin, and Full swing sizes",
        "Custom stain options",
        "Nationwide delivery",
        "Live support and fast quotes",
      ],
    },

    {
      type: "sizes",
      swings: [
        { label: "Crib", size: "30” × 57”" },
        { label: "Twin", size: "40” × 81”" },
        { label: "Full", size: "57” × 81”" },
      ],
      cushions: [
        { label: "Crib", size: "27” × 51”" },
        { label: "Twin", size: "38” × 75”" },
        { label: "Full", size: "54” × 75”" },
      ],
      note: "Sizes may vary slightly by design.",
    },

    {
      type: "resources",
      links: [
        {
          label: "View Stain Color Guide",
          url: "https://doorplaceusa.com/pages/porch-swing-stain-guide",
        },
        {
          label: "Swing Cushion Guide",
          url: "https://doorplaceusa.com/pages/cushion-guide",
        },
        {
          label: "Installation Instructions",
          url: "https://doorplaceusa.com/pages/how-to-install-a-porch-swing",
        },
        {
          label: "Get a Fast Quote",
          url: "https://doorplaceusa.com/pages/get-a-fast-quote",
        },
      ],
    },
  ];
}
