type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderCustomPorchSwingWorthCostCityHTML({
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
            alt="Is a custom porch swing worth the cost in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Is a Custom Porch Swing Worth the Cost in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Homeowners in ${city}, ${state} often wonder whether a custom porch swing
    is worth the additional cost compared to off-the-shelf options.
    The answer depends on fit, durability, and long-term value.
  </p>

  <h2 style="color:#b80d0d;">What Makes a Porch Swing “Custom”?</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Built to exact width, depth, and height</li>
    <li>Material selection based on environment and preference</li>
    <li>Custom finishes, stains, or paint</li>
    <li>Hardware matched to swing weight and structure</li>
  </ul>

  <h2 style="color:#b80d0d;">Cost vs Value Comparison</h2>
  <p style="font-size:16px;line-height:1.8;">
    While custom porch swings cost more upfront,
    they often provide better comfort, longer lifespan,
    and fewer installation issues than mass-produced swings.
  </p>

  <h2 style="color:#b80d0d;">When Custom Is Worth the Investment</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Non-standard porch or beam spacing</li>
    <li>Desire for heavier-duty construction</li>
    <li>Matching existing architectural features</li>
    <li>Long-term outdoor durability needs</li>
  </ul>

  <h2 style="color:#b80d0d;">When a Standard Swing May Be Enough</h2>
  <p style="font-size:16px;line-height:1.8;">
    Standard swings may be sufficient for smaller porches
    with typical dimensions and lighter usage.
    Budget and intended use should guide the decision.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Trying to decide if custom is right for you?</strong><br/>
    Doorplace USA can help compare standard and custom options
    based on your porch and budget.
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
