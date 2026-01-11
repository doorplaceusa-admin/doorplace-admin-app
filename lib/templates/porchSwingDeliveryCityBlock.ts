type PorchSwingDeliveryCityInput = {
  city: string;
  state: string;
  stateCode: string;
};

export function getPorchSwingDeliveryCityBlocks({ city, state, stateCode }: PorchSwingDeliveryCityInput) {
  return [
    {
      type: "hero",
      headline: `Porch Swing Delivery in ${city}, ${stateCode}`,
      subtext: `We build and deliver custom porch swings to homes across ${city} and all of ${state}.`,
    },

    {
      type: "intro",
      body: `Doorplace USA specializes in building and delivering handcrafted porch swings directly to customers in ${city}. Every swing is built to order, carefully packaged, and shipped nationwide so homeowners in ${state} can enjoy premium outdoor seating without local store limitations.`,
    },

    {
      type: "features",
      items: [
        "Nationwide porch swing delivery",
        "Custom-built wooden swings",
        "Crib, Twin, and Full sizes",
        "Weather-ready stain options",
        "Live order support",
      ],
    },

    {
      type: "delivery",
      body: `Our delivery system ensures porch swings arrive safely to ${city} and surrounding areas. We provide tracking, packaging protection, and installation guidance for every shipment.`,
    },

    {
      type: "sizes",
      swings: [
        { label: "Crib", size: "30” × 57”" },
        { label: "Twin", size: "40” × 81”" },
        { label: "Full", size: "57” × 81”" },
      ],
      note: "All porch swings are built to order and shipped directly to your location.",
    },

    {
      type: "resources",
      links: [
        {
          label: "View Stain Colors",
          url: "https://doorplaceusa.com/pages/porch-swing-stain-guide",
        },
        {
          label: "Cushion Guide",
          url: "https://doorplaceusa.com/pages/cushion-guide",
        },
        {
          label: "How Delivery Works",
          url: "https://doorplaceusa.com/pages/get-a-fast-quote",
        },
      ],
    },
  ];
}
