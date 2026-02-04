type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingClearanceCityHTML({
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
            alt="Porch swing clearance requirements in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Much Clearance Do You Need for a Porch Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Proper clearance is critical when installing a porch swing in
    ${city}, ${state}. Adequate space ensures safe movement,
    prevents structural contact, and improves comfort.
  </p>

  <h2 style="color:#b80d0d;">Recommended Porch Swing Clearance</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Front & back clearance:</strong> 24–36 inches</li>
    <li><strong>Side clearance:</strong> 12–18 inches on each side</li>
    <li><strong>Vertical clearance:</strong> Enough to hang 17–19 inches above floor</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Clearance Matters</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Prevents the swing from hitting walls or railings</li>
    <li>Allows smooth, unrestricted motion</li>
    <li>Reduces stress on mounting hardware</li>
    <li>Improves overall safety</li>
  </ul>

  <h2 style="color:#b80d0d;">Common Clearance Mistakes</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Installing too close to walls or posts</li>
    <li>Ignoring forward swing arc</li>
    <li>Underestimating space needed for larger swings</li>
  </ul>

  <h2 style="color:#b80d0d;">Clearance for Larger & Daybed Swings</h2>
  <p style="font-size:16px;line-height:1.8;">
    Larger and daybed porch swings require additional clearance
    due to increased width and swing arc.
    Always account for full movement when planning placement.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure if your porch has enough space?</strong><br/>
    Doorplace USA can help evaluate your porch
    and recommend the right swing size.
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
