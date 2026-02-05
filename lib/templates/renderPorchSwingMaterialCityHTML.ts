type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  material: string; // ✅ REQUIRED
  nearbyCities?: CityLink[];
  heroImageUrl?: string | null;
};

export function renderPorchSwingMaterialCityHTML({
  city,
  state,
  stateCode,
  material,
  heroImageUrl,
}: RenderProps): string {
  const materialLabel =
    material.charAt(0).toUpperCase() + material.slice(1);

  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="${materialLabel} porch swings in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:10px;">
    ${materialLabel} Porch Swings in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Choosing the right <strong>${materialLabel.toLowerCase()}</strong> porch swing in
    ${city}, ${stateCode} makes a major difference in durability, appearance,
    and long-term performance.
    Doorplace USA builds solid-wood porch swings using materials selected for outdoor use
    and real-world weather conditions.
  </p>

  <p style="font-size:17px;line-height:1.8;">
    Unlike mass-produced swings made with soft or laminated woods,
    our swings are handcrafted from carefully selected lumber,
    reinforced for weight, and finished with outdoor-grade stains
    designed to hold up in ${state} climates.
  </p>

  <div style="border:2px solid #b80d0d;padding:16px;background:#fdf6f6;margin:25px 0;border-radius:6px;">
    <strong>Need help choosing the right material?</strong><br/>
    Use our <strong>live chat</strong> or request pricing at
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="color:#b80d0d;font-weight:bold;"
    >
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Common Porch Swing Materials</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Cedar:</strong> Naturally resistant to rot and insects, lightweight, and ideal for outdoor use</li>
    <li><strong>Pine:</strong> Strong, versatile, and cost-effective when properly sealed and stained</li>
    <li><strong>Hardwood options:</strong> Available by request for specific design or strength needs</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Material Choice Matters</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch swings are exposed to sun, moisture, temperature changes, and everyday use.
    Selecting the correct material helps prevent warping, cracking, and premature wear.
    Doorplace USA builds swings that balance strength, comfort, and longevity.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Outdoor-rated lumber selected for stability</li>
    <li>Reinforced joints and weight-bearing areas</li>
    <li>Weather-sealed finishes for long-term protection</li>
    <li>Designs suitable for porches, patios, and pergolas</li>
  </ul>

  <h2 style="color:#b80d0d;">Built for ${city} Outdoor Spaces</h2>
  <p style="font-size:16px;line-height:1.8;">
    From shaded front porches to open backyard patios,
    Doorplace USA builds ${materialLabel.toLowerCase()} porch swings
    that perform well in real outdoor environments.
    Every swing is designed for comfort, strength, and durability.
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

  <p style="margin-top:30px;font-size:16px;line-height:1.7;">
    If you're comparing ${materialLabel.toLowerCase()} porch swings for your
    ${city}, ${state} home,
    Doorplace USA provides expert guidance, quality craftsmanship,
    and nationwide delivery.
  </p>

  <div style="margin-top:40px;text-align:center;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="background:#b80d0d;color:#fff;padding:14px 30px;font-size:18px;text-decoration:none;border-radius:6px;display:inline-block;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}
