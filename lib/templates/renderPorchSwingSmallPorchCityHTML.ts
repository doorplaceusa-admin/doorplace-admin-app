type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingSmallPorchCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:800px;margin:0 auto;padding:10px 20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="Can a porch swing fit on a small porch in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:28px;margin-bottom:10px;">
    Can a Porch Swing Fit on a Small Porch in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:16px;line-height:1.6;color:#333;margin-bottom:16px;">
    Many homeowners in ${city}, ${state} assume their porch is too small
    for a swing. In reality, with the right sizing and placement,
    porch swings can work well even on compact porches.
  </p>

  <div style="border:1px solid #000;padding:12px 15px;margin:20px 0;background:#f7f7f7;border-radius:4px;">
    <p style="margin:0;font-size:15px;line-height:1.6;">
      <strong>Wondering if a porch swing will fit your space?</strong><br>
      Call or text <strong>1-844-377-5872</strong> or
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="color:#b80d0d;text-decoration:none;">
         get a fast quote
      </a>.
    </p>
  </div>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    When a Small Porch Can Support a Swing
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>Porch depth of at least 6 feet</li>
    <li>Enough width for proper side clearance</li>
    <li>Structural ceiling or beam support</li>
    <li>Door swing does not interfere with movement</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Best Swing Options for Small Porches
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>4-foot porch swings</li>
    <li>Slim-profile designs</li>
    <li>Lightweight construction</li>
    <li>Shorter chain or rope setups</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Common Small Porch Challenges
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>Limited swing arc space</li>
    <li>Posts or railings reducing clearance</li>
    <li>Low ceiling height</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:26px;margin-bottom:10px;">
    Making a Small Porch Work
  </h2>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    Careful measurement and professional guidance
    can help maximize available space and ensure safe installation.
    In some cases, alternative mounting solutions
    or custom swing sizing may be recommended.
  </p>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Helpful Resources
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swings" style="color:#b80d0d;text-decoration:none;">
        Custom Porch Swings
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;text-decoration:none;">
        Stain Color Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;text-decoration:none;">
        Cushion Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;text-decoration:none;">
        Installation Instructions
      </a>
    </li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Get a Custom Porch Swing Quote
  </h2>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:12px;">
    If you're considering a porch swing for your ${city}, ${state} home,
    send us a photo and rough measurements of your porch space.
  </p>

  <p style="font-size:15px;font-weight:bold;margin-bottom:14px;">
    Call or text: 1-844-377-5872
  </p>

  <div style="text-align:center;margin-top:10px;margin-bottom:30px;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="display:inline-block;padding:12px 22px;border:1px solid #000;border-radius:4px;text-decoration:none;font-size:16px;color:#000;background:#f4f4f4;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}