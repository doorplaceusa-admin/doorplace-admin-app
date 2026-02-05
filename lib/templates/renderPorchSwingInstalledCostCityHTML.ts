type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingInstalledCostCityHTML({
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
            alt="Porch swing installed cost in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Much Does a Porch Swing Cost Installed in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Homeowners in ${city}, ${state} often ask how much it costs
    to have a porch swing professionally installed.
    Installed pricing typically includes the swing,
    hardware, and labor required for a safe setup.
  </p>

  <h2 style="color:#b80d0d;">Average Installed Porch Swing Cost</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Basic porch swings:</strong> $700 – $1,200 installed</li>
    <li><strong>Custom wood swings:</strong> $1,200 – $2,500+</li>
    <li><strong>Daybed porch swings:</strong> $2,000 – $4,000+</li>
  </ul>

  <h2 style="color:#b80d0d;">What’s Included in Installed Pricing?</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Swing construction or selection</li>
    <li>Load-rated mounting hardware</li>
    <li>Structural evaluation</li>
    <li>Professional installation</li>
    <li>Final adjustments for comfort and balance</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Installed Costs Vary</h2>
  <p style="font-size:16px;line-height:1.8;">
    Installed pricing in ${city}
    can vary based on swing size,
    porch structure, mounting height,
    and whether reinforcement is required.
  </p>

  <!-- ✅ Helpful Resources Internal Links -->
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
    <li>
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;">
        Request a Fast Quote
      </a>
    </li>
  </ul>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Want an exact installed price?</strong><br/>
    Doorplace USA can provide a tailored estimate
    based on your porch and swing preferences.
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
