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
};

export function renderPorchSwingSizeCityHTML({
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
            alt="Porch swing sizes in ${city}, ${stateCode}"
            style="width:100%;max-width:800px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:10px;">
    Porch Swing Sizes in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Searching for the right <strong>porch swing size in ${city}, ${stateCode}</strong>?
    Doorplace USA builds custom wooden porch swings in multiple sizes to fit
    porches, patios, pergolas, and outdoor living spaces of all shapes and widths.
  </p>

  <p style="font-size:17px;line-height:1.8;">
    Choosing the correct swing size is one of the most important steps for comfort,
    safety, and appearance. Our swings are handcrafted to provide proper seating depth,
    balanced weight distribution, and secure hanging points — not mass-produced shortcuts.
  </p>

  <div style="border:2px solid #b80d0d;padding:16px;background:#fdf6f6;margin:25px 0;border-radius:6px;">
    <strong>Get help choosing the right size:</strong><br/>
    Use our <strong>live chat</strong> or request pricing at
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="color:#b80d0d;font-weight:bold;"
    >
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Available Porch Swing Sizes</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Crib Size:</strong> 30” × 57” — ideal for compact porches and tight spaces</li>
    <li><strong>Twin Size:</strong> 40” × 81” — our most popular everyday seating option</li>
    <li><strong>Full Size:</strong> 57” × 81” — family seating and wide porch layouts</li>
    <li><strong>Custom Sizes:</strong> Built to fit unique beam spacing or design needs</li>
  </ul>
  <p style="font-size:14px;color:#555;">
    * Exact dimensions may vary slightly based on style and wood selection.
  </p>

  <h2 style="color:#b80d0d;">How to Choose the Right Porch Swing Size</h2>
  <p style="font-size:16px;line-height:1.8;">
    When selecting a swing size for your ${city} home, consider available porch width,
    hanging beam spacing, clearance from walls, and how many people will regularly use
    the swing. Our team helps verify measurements and recommends the correct size
    before your swing is built.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Proper side clearance for chains or ropes</li>
    <li>Comfortable seating depth and back support</li>
    <li>Safe beam load capacity</li>
    <li>Balanced proportions for your porch or patio</li>
  </ul>

  <h2 style="color:#b80d0d;">Built for ${city} Homes</h2>
  <p style="font-size:16px;line-height:1.8;">
    From historic front porches to modern backyard pergolas, Doorplace USA builds
    porch swings sized to match how homeowners in ${city} actually use their outdoor
    spaces. Every swing is reinforced and finished for long-term outdoor use.
  </p>

  <h2 style="color:#b80d0d;">Helpful Size & Installation Resources</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li>
      <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">
        Porch Swing Installation Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">
        Cushion Sizing Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">
        Stain & Finish Options
      </a>
    </li>
  </ul>

  <p style="margin-top:30px;font-size:16px;line-height:1.7;">
    If you're unsure which porch swing size fits your ${city}, ${state} home,
    Doorplace USA provides expert guidance, custom sizing options,
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
