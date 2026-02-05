type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingHangHeightCityHTML({
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
            alt="Porch swing hanging height in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    What Height Should a Porch Swing Hang in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Hanging a porch swing at the correct height is essential for comfort and safety in
    ${city}, ${state}. A properly hung swing allows smooth movement while keeping feet
    at a comfortable distance from the floor.
  </p>

  <h2 style="color:#b80d0d;">Recommended Porch Swing Hanging Height</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Most porch swings hang 17–19 inches above the floor</li>
    <li>Daybed swings may hang slightly higher depending on design</li>
    <li>Height should allow light foot contact while seated</li>
  </ul>

  <h2 style="color:#b80d0d;">Factors That Affect Hanging Height</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Swing size and seat depth</li>
    <li>Chain or rope length</li>
    <li>User height and comfort preferences</li>
    <li>Clearance behind and in front of the swing</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Proper Height Matters</h2>
  <p style="font-size:16px;line-height:1.8;">
    Hanging a swing too low can cause dragging and stress on hardware,
    while hanging it too high can make getting in and out uncomfortable.
    Proper height ensures balanced movement and long-term durability.
  </p>

  <h2 style="color:#b80d0d;">Fine-Tuning After Installation</h2>
  <p style="font-size:16px;line-height:1.8;">
    After initial installation, minor height adjustments are often made
    to achieve the best comfort and swing motion.
    Professional installers typically test and adjust height during setup.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure your swing is hanging at the right height?</strong><br/>
    Doorplace USA can help adjust or install your porch swing
    for optimal comfort and safety.
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
