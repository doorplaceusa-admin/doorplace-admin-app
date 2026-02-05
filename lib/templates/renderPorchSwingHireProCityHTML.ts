type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingHireProCityHTML({
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
            alt="Professional porch swing installation in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Should You Hire a Professional to Install a Porch Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Homeowners in ${city}, ${state} often ask whether hiring a professional
    for porch swing installation is worth it.
    The answer depends on swing size, porch structure,
    and long-term safety considerations.
  </p>

  <h2 style="color:#b80d0d;">Benefits of Professional Installation</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Proper evaluation of porch framing and load capacity</li>
    <li>Correct hardware selection and placement</li>
    <li>Level, balanced installation</li>
    <li>Reduced risk of structural damage</li>
    <li>Peace of mind for long-term use</li>
  </ul>

  <h2 style="color:#b80d0d;">When Hiring a Pro Makes Sense</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Daybed or oversized porch swings</li>
    <li>Pergola or gazebo installations</li>
    <li>Porches requiring reinforcement</li>
    <li>Limited access to structural framing</li>
  </ul>

  <h2 style="color:#b80d0d;">DIY vs Professional Installation</h2>
  <p style="font-size:16px;line-height:1.8;">
    While DIY installation may save upfront costs,
    professional installation helps avoid mistakes
    that can lead to repairs or safety issues later.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Thinking about professional installation?</strong><br/>
    Doorplace USA can help guide you through safe installation options
    and swing selection.
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
