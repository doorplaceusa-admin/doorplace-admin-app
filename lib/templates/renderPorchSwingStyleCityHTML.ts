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
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function renderPorchSwingStyleCityHTML({
  city,
  state,
  stateCode,
  style,
  heroImageUrl,
  nearbyCities,
}: RenderProps): string {
  const styleLabel = formatStyleLabel(style);

  return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

  <!-- ===================================================== -->
  <!-- ✅ HERO SECTION (Above Fold Conversion Block) -->
  <!-- ===================================================== -->

  ${
    heroImageUrl
      ? `
      <div style="text-align:center;margin-bottom:20px;">
        <img
          src="${heroImageUrl}"
          alt="${styleLabel} in ${city}, ${stateCode}"
          style="width:100%;max-width:650px;border-radius:10px;"
        />
      </div>
      `
      : ""
  }

  <h1 style="color:#b80d0d;font-size:36px;margin-bottom:10px;text-align:center;">
    Trusted ${styleLabel} in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;text-align:center;max-width:750px;margin:0 auto;">
    Doorplace USA builds handcrafted <strong>${styleLabel.toLowerCase()}</strong>
    designed for comfort, style, and long-term outdoor durability in
    ${city}, ${state}.
  </p>

  <!-- ✅ Quick Benefits Row -->
  <div style="margin-top:25px;display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Built by skilled craftsmen
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Nationwide delivery available
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Sizes from crib to queen
    </div>

  </div>

  <!-- ✅ Primary CTA Above Fold -->
  <div style="margin-top:30px;text-align:center;">
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
       style="background:#b80d0d;color:#fff;padding:15px 34px;
              font-size:18px;text-decoration:none;border-radius:8px;
              display:inline-block;font-weight:bold;">
      Request Pricing for ${city}
    </a>
  </div>

  <!-- ===================================================== -->
  <!-- ✅ MAIN CONTENT SECTION -->
  <!-- ===================================================== -->

  <div style="margin-top:45px;">

    <h2 style="color:#b80d0d;font-size:26px;">
      Choosing the Right Porch Swing Style in ${city}
    </h2>

    <p style="font-size:17px;line-height:1.8;">
      Choosing the right <strong>${styleLabel.toLowerCase()}</strong> plays a major role
      in comfort, appearance, and how your outdoor space is used.
      Doorplace USA builds swings designed to match both function and architectural style.
    </p>

    <p style="font-size:17px;line-height:1.8;">
      From classic and farmhouse designs to modern, luxury, and specialty styles,
      every build is reinforced for long-term outdoor use across ${state}.
    </p>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ MID-PAGE QUOTE BLOCK -->
  <!-- ===================================================== -->

  <div style="margin:45px 0;padding:25px;border:2px solid #b80d0d;
              border-radius:10px;background:#fff8f8;">

    <h2 style="margin-top:0;color:#b80d0d;">
      Need Help Choosing the Right Style?
    </h2>

    <p style="font-size:16px;line-height:1.7;">
      Tell us what you're looking for and our team will help you select the perfect
      porch swing style for your home in ${city}.
    </p>

    <div style="text-align:center;margin-top:20px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:12px 28px;
                font-size:17px;text-decoration:none;border-radius:6px;
                font-weight:bold;">
        Get My Quote
      </a>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ COMMON STYLES -->
  <!-- ===================================================== -->

  <h2 style="color:#b80d0d;">
    Common Porch Swing Styles
  </h2>

  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Daybed & bed swings:</strong> Ideal for lounging and full-body relaxation</li>
    <li><strong>Farmhouse & rustic:</strong> Traditional styling with wide boards and deep seating</li>
    <li><strong>Modern & contemporary:</strong> Clean lines and minimal profiles</li>
    <li><strong>Luxury & oversized:</strong> Built for comfort, weight capacity, and presence</li>
    <li><strong>Custom styles:</strong> Tailored designs based on your space and vision</li>
  </ul>

  <h2 style="color:#b80d0d;">
    Why Style Selection Matters
  </h2>

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

  <h2 style="color:#b80d0d;">
    Built for ${city} Outdoor Spaces
  </h2>

  <p style="font-size:16px;line-height:1.8;">
    Whether installed on a front porch, under a pergola, or in a backyard setting,
    Doorplace USA builds ${styleLabel.toLowerCase()} that perform well
    in real outdoor environments across ${state}.
  </p>

  <!-- ===================================================== -->
  <!-- ✅ EXPERTISE CARDS -->
  <!-- ===================================================== -->

  <h2 style="color:#b80d0d;">
    Why Doorplace USA Swings Stand Out
  </h2>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
              gap:18px;margin-top:20px;">

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Custom Built Styles</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        From daybed swings to farmhouse designs, every style is handcrafted for your home.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Outdoor Durability</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        Reinforced construction and materials selected for real outdoor environments.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Nationwide Delivery</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        We ship porch swings across the U.S. with expert support available anytime.
      </p>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ FAQ SECTION (SEO BOOSTER) -->
  <!-- ===================================================== -->

  <div style="margin-top:55px;">

    <h2 style="color:#b80d0d;">
      Frequently Asked Questions
    </h2>

    <p style="font-size:16px;line-height:1.8;">
      <strong>What porch swing sizes are available?</strong><br>
      Doorplace USA offers sizes ranging from crib swings to full daybed and queen-size swings.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>Do you deliver ${styleLabel.toLowerCase()} to ${city}, ${stateCode}?</strong><br>
      Yes — we provide nationwide delivery, including throughout ${state}.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>How long does it take to build a custom swing?</strong><br>
      Most swings are built within 14–21 business days depending on upgrades.
    </p>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ HELPFUL RESOURCES (Internal Links) -->
  <!-- ===================================================== -->

  <div style="margin-top:55px;">

    <h2 style="color:#b80d0d;">
      Helpful Resources
    </h2>

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

  </div>

  <!-- ===================================================== -->
  <!-- ✅ INTERNAL LINKING: NEARBY CITIES -->
  <!-- ===================================================== -->

  ${
    nearbyCities && nearbyCities.length > 0
      ? `
      <div style="margin-top:55px;">
        <h2 style="color:#b80d0d;">
          Nearby Areas We Also Serve
        </h2>

        <ul style="line-height:1.9;font-size:16px;padding-left:18px;">
          ${nearbyCities
            .slice(0, 8)
            .map(
              (c) => `
              <li>
                <a href="https://doorplaceusa.com/pages/${c.slug}"
                   style="color:#b80d0d;">
                  ${styleLabel} in ${c.city}
                </a>
              </li>
              `
            )
            .join("")}
        </ul>
      </div>
      `
      : ""
  }

  <!-- ===================================================== -->
  <!-- ✅ FINAL CTA -->
  <!-- ===================================================== -->

  <div style="margin-top:60px;text-align:center;">

    <h2 style="color:#b80d0d;">
      Ready to Order Your ${styleLabel}?
    </h2>

    <p style="font-size:16px;line-height:1.7;max-width:700px;margin:0 auto;">
      Doorplace USA offers expert craftsmanship, guidance, and nationwide delivery
      for customers in ${city}, ${state}.
    </p>

    <div style="margin-top:25px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:15px 34px;
                font-size:18px;text-decoration:none;border-radius:8px;
                display:inline-block;font-weight:bold;">
        Get a Fast Quote
      </a>
    </div>

  </div>

</div>
`;
}
