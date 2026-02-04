type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingWeightCapacityCityHTML({
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
            alt="Porch swing weight capacity in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Much Weight Can a Porch Swing Hold in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Porch swing weight capacity is one of the most important safety considerations
    for homeowners in ${city}, ${state}.
    The total weight a porch swing can support depends on the swing design,
    mounting hardware, and the structure it is attached to.
  </p>

  <h2 style="color:#b80d0d;">Typical Porch Swing Weight Limits</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Standard porch swings:</strong> 400–600 lbs</li>
    <li><strong>Heavy-duty wood swings:</strong> 600–800+ lbs</li>
    <li><strong>Daybed porch swings:</strong> 800–1,200+ lbs</li>
  </ul>

  <h2 style="color:#b80d0d;">What Determines Weight Capacity?</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Swing size and construction materials</li>
    <li>Type of mounting hardware used</li>
    <li>Spacing between mounting points</li>
    <li>Strength of beams, joists, or supports</li>
    <li>Whether reinforcement is installed</li>
  </ul>

  <h2 style="color:#b80d0d;">Why the Mounting Structure Matters</h2>
  <p style="font-size:16px;line-height:1.8;">
    Even the strongest porch swing can only support as much weight
    as the structure it is mounted to.
    Many porches in ${city} require reinforcement before safely supporting
    heavier swings or multiple occupants.
  </p>

  <h2 style="color:#b80d0d;">Overloading Risks</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Hardware failure or loosening</li>
    <li>Structural damage to porch framing</li>
    <li>Uneven swing movement or instability</li>
    <li>Potential injury or property damage</li>
  </ul>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Weight ratings vary by setup.</strong><br/>
    Doorplace USA can help determine the safest swing size
    and mounting approach for your porch.
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
