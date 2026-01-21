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
  usecase: string;
};

export function renderPorchSwingUsecaseCityHTML({
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
            alt="Porch swing use cases in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:10px;">
    Porch Swings for Outdoor Spaces in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    A well-built porch swing can transform how you use your outdoor space.
    Doorplace USA designs <strong>custom porch swings for real-world use in ${city}, ${stateCode}</strong>,
    built to fit porches, patios, pergolas, decks, and covered outdoor areas.
  </p>

  <p style="font-size:17px;line-height:1.8;">
    Whether you're creating a relaxing front-porch retreat or adding seating to a backyard pergola,
    our swings are engineered for comfort, safety, and long-term outdoor performance.
  </p>

  <div style="border:2px solid #b80d0d;padding:16px;background:#fdf6f6;margin:25px 0;border-radius:6px;">
    <strong>Need help choosing the right swing for your space?</strong><br/>
    Use our <strong>live chat</strong> or request pricing at
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="color:#b80d0d;font-weight:bold;"
    >
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Popular Porch Swing Use Cases</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li><strong>Front Porches:</strong> Traditional seating for curb appeal and everyday relaxation</li>
    <li><strong>Covered Patios:</strong> Comfortable seating protected from sun and rain</li>
    <li><strong>Pergolas & A-Frames:</strong> Freestanding structures designed for swinging loads</li>
    <li><strong>Decks:</strong> Swings mounted to beams or custom support frames</li>
    <li><strong>Outdoor Rooms:</strong> Screened or enclosed spaces for year-round use</li>
  </ul>

  <h2 style="color:#b80d0d;">Designed for Comfort & Safety</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch swings must be built differently depending on where they’re installed.
    Doorplace USA reinforces weight-bearing points, spacing, and hanging hardware
    to match the specific use case of your outdoor space.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Proper beam spacing and hanging height</li>
    <li>Chain or rope configurations based on location</li>
    <li>Balanced weight distribution for smooth motion</li>
    <li>Outdoor-rated finishes for long-term exposure</li>
  </ul>

  <h2 style="color:#b80d0d;">Built for ${city} Lifestyles</h2>
  <p style="font-size:16px;line-height:1.8;">
    From quiet morning coffee on the porch to evening gatherings under a pergola,
    Doorplace USA builds porch swings that fit how homeowners in ${city} use their outdoor spaces.
    Every swing is handcrafted and delivered ready for installation.
  </p>

  <h2 style="color:#b80d0d;">Helpful Planning & Installation Resources</h2>
  <ul style="line-height:1.8;font-size:16px;">
    <li>
      <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">
        Porch Swing Installation Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">
        Cushion & Comfort Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">
        Stain & Finish Options
      </a>
    </li>
  </ul>

  <p style="margin-top:30px;font-size:16px;line-height:1.7;">
    If you're planning a porch swing installation for your ${city}, ${state} home,
    Doorplace USA provides expert guidance, durable craftsmanship,
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
