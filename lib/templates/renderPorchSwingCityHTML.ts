type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  nearbyCities?: CityLink[];
  heroImageUrl?: string | null;
};

export function renderPorchSwingCityHTML({
  city,
  state,
  stateCode,
  slug,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img src="${heroImageUrl}" alt="Porch swings in ${city}, ${stateCode}" style="width:100%;max-width:500px;border-radius:6px;" />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:10px;">
    Porch Swings in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Looking for a handcrafted porch swing in <strong>${city}, ${stateCode}</strong>?
    Doorplace USA builds high-quality wooden porch swings designed for real outdoor use,
    comfort, and long-term durability.
  </p>

  <div style="border:2px solid #b80d0d;padding:16px;background:#fdf6f6;margin:25px 0;border-radius:6px;">
    <strong>Get a fast quote:</strong><br>
    Use the <strong>live chat</strong> or visit
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;font-weight:bold;">
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Why ${city} Homeowners Choose Doorplace USA</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li>Solid wood construction — no hollow lumber</li>
    <li>Crib, twin, and full swing sizes</li>
    <li>Stain options designed for ${state} weather</li>
    <li>Nationwide shipping with installation guidance</li>
    <li>Live chat and real human support</li>
  </ul>

  <h2 style="color:#b80d0d;">Popular Porch Swing Locations</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li>Front porches</li>
    <li>Covered patios</li>
    <li>Screened-in porches</li>
    <li>Backyard pergolas</li>
    <li>Gazebos and outdoor rooms</li>
  </ul>

  <h2 style="color:#b80d0d;">Porch Swing Sizes</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Crib:</strong> 30” × 57”</li>
    <li><strong>Twin:</strong> 40” × 81”</li>
    <li><strong>Full:</strong> 57” × 81”</li>
  </ul>
  <p style="font-size:14px;color:#555;">* Sizes may vary slightly by design.</p>

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

  <h2 style="color:#b80d0d;">Installation & Support in ${city}</h2>
  <p style="font-size:16px;line-height:1.7;">
    We help customers in ${city} plan safe, secure swing installations —
    including beam checks, spacing, and hanging hardware.
  </p>

  <p style="margin-top:30px;font-size:16px;line-height:1.7;">
    Whether you're in <strong>${city}</strong> or anywhere in ${state},
    Doorplace USA builds and ships custom porch swings nationwide.
  </p>

  <!-- Primary CTA Button -->
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
