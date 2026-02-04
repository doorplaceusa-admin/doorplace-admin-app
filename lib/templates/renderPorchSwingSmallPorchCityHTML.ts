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
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

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

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Can a Porch Swing Fit on a Small Porch in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Many homeowners in ${city}, ${state} assume their porch is too small
    for a swing. In reality, with the right sizing and placement,
    porch swings can work well even on compact porches.
  </p>

  <h2 style="color:#b80d0d;">When a Small Porch Can Support a Swing</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Porch depth of at least 6 feet</li>
    <li>Enough width for proper side clearance</li>
    <li>Structural ceiling or beam support</li>
    <li>Door swing does not interfere with movement</li>
  </ul>

  <h2 style="color:#b80d0d;">Best Swing Options for Small Porches</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>4-foot porch swings</li>
    <li>Slim-profile designs</li>
    <li>Lightweight construction</li>
    <li>Shorter chain or rope setups</li>
  </ul>

  <h2 style="color:#b80d0d;">Common Small Porch Challenges</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Limited swing arc space</li>
    <li>Posts or railings reducing clearance</li>
    <li>Low ceiling height</li>
  </ul>

  <h2 style="color:#b80d0d;">Making a Small Porch Work</h2>
  <p style="font-size:16px;line-height:1.8;">
    Careful measurement and professional guidance
    can help maximize available space and ensure safe installation.
    In some cases, alternative mounting solutions
    or custom swing sizing may be recommended.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure your porch is big enough?</strong><br/>
    Doorplace USA can help assess your space
    and recommend a swing that fits comfortably.
  </div>

  <div style="text-align:center;margin-top:30px;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="background:#b80d0d;color:#fff;padding:14px 30px;font-size:18px;text-decoration:none;border-radius:6px;display:inline-block;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}
