type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  style: string; // barn door style
  heroImageUrl?: string | null;
};

function formatStyleLabel(style: string) {
  return style
    .replace(/-/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function renderBarnDoorStyleCityHTML({
  city,
  state,
  stateCode,
  style,
  heroImageUrl,
}: RenderProps): string {
  const styleLabel = formatStyleLabel(style);

  return `
<div style="max-width:800px;margin:0 auto;padding:10px 20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<img
          src="${heroImageUrl}"
          alt="${styleLabel} in ${city}, ${stateCode} by Doorplace USA"
          style="width:70%;max-width:500px;border-radius:6px;margin:0 auto 18px auto;display:block;"
        >`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:28px;margin-bottom:10px;">
    ${styleLabel}  in ${city}, ${stateCode}
  </h1>

  <p style="font-size:16px;line-height:1.6;color:#333;margin-bottom:16px;">
    Doorplace USA designs and builds <strong>${styleLabel.toLowerCase()}</strong>
    for real homes in ${city}, ${state}. Every door is built to order,
    stained by hand, and sized specifically for your opening so it fits
    and functions exactly as intended.
  </p>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:18px;">
    We specialize in sliding barn door systems used for bedrooms, offices,
    bathrooms, pantries, and room dividers.
    If you can send us a photo and measurements, we can usually build
    a custom barn door for your space.
  </p>

  <div style="border:1px solid #000;padding:12px 15px;margin:20px 0;background:#f7f7f7;border-radius:4px;">
    <p style="margin:0;font-size:15px;line-height:1.6;">
      <strong>Ready to talk about a custom barn door?</strong><br>
      Call or text <strong>1-844-377-5872</strong> or
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;text-decoration:none;">
        get a fast quote
      </a>.
    </p>
  </div>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    ${styleLabel} Options
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>Single sliding barn doors.</li>
    <li>Double sliding barn doors and wide room dividers.</li>
    <li>Bifolding barn doors for larger openings.</li>
    <li>Bypass barn doors for limited clearance.</li>
    <li>Glass or mirrored inserts (on select designs).</li>
    <li>Rustic, modern, or fully custom layouts.</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Door Options & Upgrades
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>Single or double door configurations.</li>
    <li>Sliding, bifold, or bypass hardware systems.</li>
    <li>Clear or frosted glass upgrades (select styles).</li>
    <li>Choice of handle style and hardware finish.</li>
    <li>Custom panel layouts and trim details.</li>
    <li>Stain-only finish (we do not paint doors).</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Stain & Finish Options
  </h2>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    View available stain colors in our
    <a href="https://doorplaceusa.com/pages/wood-stain-colors" style="color:#b80d0d;text-decoration:none;">
      Wood Stain Colors Guide
    </a>.
  </p>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    How the Custom Door Process Works
  </h2>

  <ol style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li><strong>Send a photo & measurements:</strong> Text us your opening.</li>
    <li><strong>Select your style:</strong> We confirm layout and stain.</li>
    <li><strong>Receive your quote:</strong> Door, hardware, and installation.</li>
  </ol>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:26px;margin-bottom:10px;">
    Helpful Door Resources
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:18px;">
    <li>
      <a href="https://doorplaceusa.com/pages/wood-stain-colors" style="color:#b80d0d;text-decoration:none;">
        View Wood Stain Colors Guide
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/entire-photo-gallery" style="color:#b80d0d;text-decoration:none;">
        View Our Entire Photo Gallery
      </a>
    </li>
    <li>
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;text-decoration:none;">
        Get a Fast Quote
      </a>
    </li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Get a Custom Barn Door Quote
  </h2>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:12px;">
    If you’re planning a ${styleLabel.toLowerCase()} for your
    ${city}, ${state} home, the fastest way to start is to send us
    a photo and rough measurements.
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
