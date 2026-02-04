type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingCostFactorsCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="Porch swing cost factors in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    What Affects the Cost of a Porch Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    The cost of a porch swing in ${city}, ${state}
    depends on several key factors including size, materials,
    installation requirements, and customization options.
  </p>

  <h2 style="color:#b80d0d;">Main Factors That Influence Porch Swing Cost</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Swing size:</strong> Larger swings require more material and support</li>
    <li><strong>Wood type:</strong> Pine, cedar, oak, and hardwoods vary in price</li>
    <li><strong>Hardware & mounting:</strong> Heavy-duty hardware increases cost</li>
    <li><strong>Installation complexity:</strong> Reinforcement or custom mounting adds labor</li>
    <li><strong>Customization:</strong> Stain, paint, or design upgrades</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Prices Vary Between Homes</h2>
  <p style="font-size:16px;line-height:1.8;">
    Even within ${city}, porch swing pricing can vary
    based on porch structure, ceiling height,
    beam strength, and access to mounting locations.
  </p>

  <h2 style="color:#b80d0d;">Upfront Cost vs Long-Term Value</h2>
  <p style="font-size:16px;line-height:1.8;">
    Investing in proper materials and installation
    helps prevent future repairs and improves
    long-term safety and durability.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Looking for accurate pricing?</strong><br/>
    Doorplace USA can provide cost guidance
    based on your specific porch and swing options.
  </div>

  <div style="text-align:center;margin-top:30px;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="background:#b80d0d;color:#fff;padding:14px 30px;font-size:18px;text-decoration:none;border-radius:6px;display:inline-block;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}
