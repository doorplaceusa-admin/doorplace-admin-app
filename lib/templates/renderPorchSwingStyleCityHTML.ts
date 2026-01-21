type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  nearbyCities?: CityLink[]; // kept for compatibility
  heroImageUrl?: string | null;
  style: string;
};

export function renderPorchSwingStyleCityHTML({
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
            alt="Porch swing styles in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:10px;">
    Porch Swing Styles in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Finding the right <strong>porch swing style in ${city}, ${stateCode}</strong>
    helps define the look and feel of your outdoor space.
    Doorplace USA builds handcrafted porch swings in a range of styles
    designed to complement both traditional and modern homes.
  </p>

  <p style="font-size:17px;line-height:1.8;">
    From clean-lined modern designs to rustic farmhouse and classic Southern styles,
    each swing is built to match your home’s architecture while delivering
    long-term comfort and durability.
  </p>

  <div style="border:2px solid #b80d0d;padding:16px;background:#fdf6f6;margin:25px 0;border-radius:6px;">
    <strong>Need help choosing the right style?</strong><br/>
    Use our <strong>live chat</strong> or request pricing at
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="color:#b80d0d;font-weight:bold;"
    >
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Popular Porch Swing Styles</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Classic:</strong> Timeless designs with traditional slats and proportions</li>
    <li><strong>Farmhouse:</strong> Rustic styling with wide boards and relaxed comfort</li>
    <li><strong>Modern:</strong> Clean lines, minimal profiles, and contemporary finishes</li>
    <li><strong>Rustic:</strong> Natural textures and heavier wood profiles</li>
    <li><strong>Custom:</strong> Built-to-order designs tailored to your vision</li>
  </ul>

  <h2 style="color:#b80d0d;">Choosing a Style That Fits Your Home</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch swing style should complement your home’s exterior, porch layout,
    and overall design aesthetic. Our team helps homeowners in ${city}
    select a swing that feels natural, balanced, and visually appealing
    within their outdoor space.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Front porches and entry-facing spaces</li>
    <li>Backyard patios and outdoor lounges</li>
    <li>Pergolas and freestanding A-frame structures</li>
    <li>Covered decks and screened-in porches</li>
  </ul>

  <h2 style="color:#b80d0d;">Craftsmanship Meets Design</h2>
  <p style="font-size:16px;line-height:1.8;">
    Every Doorplace USA porch swing is handcrafted using solid wood,
    reinforced joinery, and outdoor-grade finishes.
    Style never comes at the expense of strength or comfort.
  </p>

  <h2 style="color:#b80d0d;">Helpful Style & Design Resources</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">
        Stain & Finish Options
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">
        Cushion & Decor Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">
        Porch Swing Installation Guide
      </a>
    </li>
  </ul>

  <p style="margin-top:30px;font-size:16px;line-height:1.7;">
    If you're exploring porch swing styles for your ${city}, ${state} home,
    Doorplace USA offers expert guidance, custom craftsmanship,
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
