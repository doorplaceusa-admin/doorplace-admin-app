type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingVsRockerCostCityHTML({
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
            alt="Porch swing vs porch rocker cost in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Porch Swing vs Porch Rocker Cost in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Homeowners in ${city}, ${state} often compare porch swings and porch rockers
    when planning outdoor seating.
    While both offer comfort, costs differ based on construction,
    installation needs, and space requirements.
  </p>

  <h2 style="color:#b80d0d;">Average Cost Comparison</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Porch rockers:</strong> $300 – $900</li>
    <li><strong>Porch swings (installed):</strong> $700 – $2,500+</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Porch Swings Cost More</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Hanging hardware and mounting requirements</li>
    <li>Structural evaluation and reinforcement</li>
    <li>Professional installation labor</li>
    <li>Larger size and heavier materials</li>
  </ul>

  <h2 style="color:#b80d0d;">Which Option Is Right for Your Porch?</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch rockers are ideal for smaller spaces
    and minimal installation,
    while porch swings offer a relaxed swinging experience
    but require more planning and support.
  </p>

  <h2 style="color:#b80d0d;">Long-Term Value Considerations</h2>
  <p style="font-size:16px;line-height:1.8;">
    While rockers cost less upfront,
    porch swings often become a focal point
    that adds aesthetic and functional value to the porch.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Still deciding between a swing or rocker?</strong><br/>
    Doorplace USA can help compare options
    and recommend the best fit for your space and budget.
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
