type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingInstallationProcessCityHTML({
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
            alt="How porch swings are installed in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Is a Porch Swing Installed in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Porch swing installation in ${city}, ${state}
    follows a structured process to ensure safety, balance,
    and long-term durability.
    Below is a step-by-step overview of how professional porch swing
    installations are typically completed.
  </p>

  <h2 style="color:#b80d0d;">Step 1: Structural Evaluation</h2>
  <p style="font-size:16px;line-height:1.8;">
    The installation begins by identifying solid structural framing
    such as ceiling joists, beams, or headers.
    Decorative ceiling boards are never used for load-bearing support.
  </p>

  <h2 style="color:#b80d0d;">Step 2: Mounting Point Layout</h2>
  <p style="font-size:16px;line-height:1.8;">
    Mounting points are measured and marked based on swing width,
    chain or rope angle, and recommended spacing.
    Proper spacing ensures smooth swing motion without twisting.
  </p>

  <h2 style="color:#b80d0d;">Step 3: Hardware Installation</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Lag bolts or eye bolts rated for swing loads</li>
    <li>Heavy-duty anchors installed directly into framing</li>
    <li>Outdoor-rated hardware for weather exposure</li>
  </ul>

  <h2 style="color:#b80d0d;">Step 4: Hanging the Porch Swing</h2>
  <p style="font-size:16px;line-height:1.8;">
    The porch swing is hung using chains or rope,
    leveled front-to-back and side-to-side,
    and adjusted to the proper seating height from the floor.
  </p>

  <h2 style="color:#b80d0d;">Step 5: Safety Check & Load Testing</h2>
  <p style="font-size:16px;line-height:1.8;">
    Final adjustments are made and the installation is tested
    to confirm stability, even weight distribution,
    and secure attachment points.
  </p>

  <h2 style="color:#b80d0d;">Professional vs DIY Installation</h2>
  <p style="font-size:16px;line-height:1.8;">
    While some homeowners attempt DIY porch swing installation,
    professional installation helps avoid structural damage,
    uneven hanging, and safety risks—especially for larger swings.
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
    <strong>Need help installing a porch swing in ${city}?</strong><br/>
    Doorplace USA can assist with swing selection,
    mounting guidance, and installation recommendations.
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
