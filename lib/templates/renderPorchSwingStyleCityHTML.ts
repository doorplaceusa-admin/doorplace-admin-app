type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  style: string; // ✅ REQUIRED
  nearbyCities?: CityLink[];
  heroImageUrl?: string | null;
};

function formatStyleLabel(style: string) {
  return style
    .replace(/-/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function renderPorchSwingStyleCityHTML({
  city,
  state,
  stateCode,
  style,
  heroImageUrl,
}: RenderProps): string {
  const styleLabel = formatStyleLabel(style);

  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="${styleLabel} in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:10px;">
    ${styleLabel} in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Choosing the right <strong>${styleLabel.toLowerCase()}</strong> in
    ${city}, ${stateCode} plays a major role in comfort, appearance,
    and how your outdoor space is used.
    Doorplace USA builds handcrafted porch swings designed to match
    both function and architectural style.
  </p>

  <p style="font-size:17px;line-height:1.8;">
    From classic and farmhouse designs to modern, luxury, and specialty styles,
    each swing is built with balanced proportions, reinforced structure,
    and materials selected for long-term outdoor use in ${state}.
  </p>

  <div style="border:2px solid #b80d0d;padding:16px;background:#fdf6f6;margin:25px 0;border-radius:6px;">
    <strong>Need help choosing the right porch swing style?</strong><br/>
    Use our <strong>live chat</strong> or request pricing at
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="color:#b80d0d;font-weight:bold;"
    >
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Common Porch Swing Styles</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Daybed & bed swings:</strong> Ideal for lounging and full-body relaxation</li>
    <li><strong>Farmhouse & rustic:</strong> Traditional styling with wide boards and deep seating</li>
    <li><strong>Modern & contemporary:</strong> Clean lines and minimal profiles</li>
    <li><strong>Luxury & oversized:</strong> Built for comfort, weight capacity, and presence</li>
    <li><strong>Custom styles:</strong> Tailored designs based on your space and vision</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Style Selection Matters</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch swing style affects how the swing fits your space, how it’s used,
    and how it complements your home.
    Selecting the right style helps ensure proper proportions,
    comfortable seating depth, and visual balance.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Designed for porches, patios, pergolas, and backyard spaces</li>
    <li>Available in multiple sizes from crib to queen</li>
    <li>Compatible with chain, rope, or freestanding structures</li>
    <li>Balanced for comfort, support, and durability</li>
  </ul>

  <h2 style="color:#b80d0d;">Built for ${city} Outdoor Spaces</h2>
  <p style="font-size:16px;line-height:1.8;">
    Whether installed on a front porch, under a pergola, or in a backyard setting,
    Doorplace USA builds ${styleLabel.toLowerCase()} that perform well
    in real outdoor environments across ${state}.
  </p>

  <h2 style="color:#b80d0d;">Helpful Style & Design Resources</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">
        Stain & Finish Options
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">
        Porch Swing Installation Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">
        Cushion & Accessory Guide
      </a>
    </li>
  </ul>

  <p style="margin-top:30px;font-size:16px;line-height:1.7;">
    If you're exploring ${styleLabel.toLowerCase()} for your
    ${city}, ${state} home,
    Doorplace USA offers expert guidance,
    quality craftsmanship, and nationwide delivery.
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
