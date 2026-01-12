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

export function renderPorchSwingDeliveryCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:900px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `
    <div style="text-align:center;margin-bottom:25px;">
      <img src="${heroImageUrl}"
           alt="Porch Swings in ${city}, ${stateCode}"
           style="width:100%;max-width:850px;border-radius:6px;" />
    </div>
    `
      : ""
  }

  <h1 style="color:#b80d0d;font-size:34px;margin-bottom:10px;">
    Custom Porch Swings in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.8;">
    Looking for a <strong>custom porch swing in ${city}, ${stateCode}</strong>?  
    Doorplace USA builds heavy-duty solid-wood porch swings for Texas homes — built for heat, humidity,
    storms, and everyday outdoor use.
  </p>

  <p style="font-size:17px;line-height:1.8;">
    Unlike mass-produced furniture, our porch swings are handcrafted, reinforced for weight,
    and finished with outdoor-grade stains designed to hold up in Texas weather.
    Whether you live in North Texas, Central Texas, or the Gulf Coast, your swing is built to last.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:28px 0;border-radius:6px;">
    <strong>Fast Quote & Ordering:</strong><br/>
    Use our <strong>live chat</strong> or request pricing at  
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;font-weight:bold;">
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Why ${city}, Texas Homeowners Choose Doorplace USA</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Solid wood porch swings — never cheap imports</li>
    <li>Reinforced frames for adults and family seating</li>
    <li>Weather-sealed finishes designed for Texas climates</li>
    <li>Multiple sizes for porches, patios, pergolas, and decks</li>
    <li>Nationwide freight delivery with protective packaging</li>
    <li>Real support with live chat — no call centers</li>
  </ul>

  <h2 style="color:#b80d0d;">Porch Swings Built for Texas Homes</h2>
  <p style="font-size:16px;line-height:1.8;">
    From front porches in ${city} to backyard patios, ranch homes, lake houses,
    pergolas, and covered decks across Texas, Doorplace USA designs swings that fit
    the way Texans actually use their outdoor space.
  </p>

  <p style="font-size:16px;line-height:1.8;">
    Our swings are commonly installed on:
  </p>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Covered porches</li>
    <li>Backyard patios</li>
    <li>Pergolas and A-frames</li>
    <li>Decks and balcony beams</li>
    <li>Gazebos and outdoor pavilions</li>
  </ul>

  <h2 style="color:#b80d0d;">Porch Swing Sizes</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Crib:</strong> 30” × 57” — compact patios and smaller porches</li>
    <li><strong>Twin:</strong> 40” × 81” — our most popular everyday size</li>
    <li><strong>Full:</strong> 57” × 81” — family seating and wide porches</li>
  </ul>
  <p style="font-size:14px;color:#555;">* Sizes may vary slightly by design and model.</p>

  <h2 style="color:#b80d0d;">Texas Shipping & Delivery</h2>
  <p style="font-size:16px;line-height:1.8;">
    Doorplace USA ships porch swings to ${city} and throughout Texas using professional
    freight carriers. Each swing is carefully packed and delivered ready for installation.
    We provide guidance on beam spacing, hanging height, and hardware selection.
  </p>

  <p style="font-size:16px;line-height:1.8;">
    Your swing is built in our shop and shipped directly to your home — no big-box stores,
    no cheap overseas furniture.
  </p>

  <h2 style="color:#b80d0d;">Helpful Resources</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><a href="https://doorplaceusa.com/pages/porch-swings" style="color:#b80d0d;">Custom Swings Home Page</a></li>
    <li><a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">Stain Color Guide</a></li>
    <li><a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">Cushion Guide</a></li>
    <li><a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">Installation Instructions</a></li>
  </ul>

  <p style="margin-top:30px;font-size:16px;line-height:1.8;">
    If you're searching for <strong>custom porch swings in ${city}, TX</strong>,
    Doorplace USA provides professional-grade craftsmanship, Texas-ready materials,
    and nationwide delivery backed by real support.
  </p>

  <div style="margin-top:40px;text-align:center;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="background:#b80d0d;color:#fff;padding:14px 34px;font-size:18px;text-decoration:none;border-radius:6px;display:inline-block;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}
