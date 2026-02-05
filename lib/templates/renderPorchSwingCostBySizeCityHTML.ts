type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingCostBySizeCityHTML({
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
            alt="Porch swing cost by size in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Porch Swing Cost by Size in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Porch swing pricing in ${city}, ${state}
    varies significantly based on swing size.
    Larger swings require more material,
    heavier hardware, and additional installation support.
  </p>

  <h2 style="color:#b80d0d;">Average Porch Swing Cost by Size</h2>

  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>4-foot porch swings:</strong> $700 – $1,200 installed</li>
    <li><strong>5-foot porch swings:</strong> $900 – $1,700 installed</li>
    <li><strong>6-foot porch swings:</strong> $1,200 – $2,500+ installed</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Size Affects Cost</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Increased lumber and material usage</li>
    <li>Higher swing weight and load requirements</li>
    <li>Stronger mounting hardware</li>
    <li>More complex installation</li>
  </ul>

  <h2 style="color:#b80d0d;">Choosing the Right Size for Your Porch</h2>
  <p style="font-size:16px;line-height:1.8;">
    The best swing size depends on porch width,
    ceiling height, clearance space,
    and how many people will regularly use the swing.
  </p>

  <h2 style="color:#b80d0d;">Installed Cost vs Swing-Only Cost</h2>
  <p style="font-size:16px;line-height:1.8;">
    Swing-only pricing may appear lower,
    but installed cost reflects proper hardware,
    structural evaluation, and safe mounting.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure which size fits your porch?</strong><br/>
    Doorplace USA can help determine the ideal swing size
    and provide accurate pricing for your home.
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
