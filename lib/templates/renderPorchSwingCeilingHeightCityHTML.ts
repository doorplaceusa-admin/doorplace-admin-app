type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingCeilingHeightCityHTML({
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
            alt="Porch swing ceiling height requirements in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Much Ceiling Height Is Needed for a Porch Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Ceiling height is a key factor when installing a porch swing in
    ${city}, ${state}. Adequate height ensures proper hanging clearance,
    comfortable seating, and smooth swing motion.
  </p>

  <h2 style="color:#b80d0d;">Minimum Ceiling Height Guidelines</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Minimum ceiling height:</strong> 8 feet</li>
    <li><strong>Ideal ceiling height:</strong> 9–10 feet</li>
    <li><strong>Daybed swings:</strong> 10+ feet recommended</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Ceiling Height Matters</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Allows proper hanging height (17–19 inches above floor)</li>
    <li>Provides clearance for chains or ropes</li>
    <li>Ensures smooth swing arc without obstruction</li>
    <li>Improves overall comfort and safety</li>
  </ul>

  <h2 style="color:#b80d0d;">Common Ceiling Height Issues</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Low ceilings limiting swing height</li>
    <li>Decorative ceilings without structural support</li>
    <li>Uneven ceiling surfaces affecting alignment</li>
  </ul>

  <h2 style="color:#b80d0d;">Solutions for Low Ceilings</h2>
  <p style="font-size:16px;line-height:1.8;">
    For porches with lower ceilings,
    shorter chains, compact swing designs,
    or alternative mounting solutions may be required.
    Professional guidance can help determine the safest setup.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure your ceiling is high enough?</strong><br/>
    Doorplace USA can help evaluate your porch
    and recommend safe installation options.
  </div>

  <!-- Helpful Resources Internal Links -->
  <h2 style="color:#b80d0d;">Helpful Resources</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swings" style="color:#b80d0d;">
        Custom Swings Home Page
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">
        Stain Color Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">
        Cushion Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">
        Installation Instructions
      </a>
    </li>
  </ul>

  <!-- Primary CTA Button -->
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
