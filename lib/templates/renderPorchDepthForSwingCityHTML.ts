type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchDepthForSwingCityHTML({
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
            alt="Porch depth needed for a porch swing in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Deep Should a Porch Be for a Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Porch depth plays a major role in whether a porch swing will fit comfortably
    in ${city}, ${state}. Adequate depth ensures safe swing movement
    without hitting walls, railings, or doors.
  </p>

  <h2 style="color:#b80d0d;">Minimum Porch Depth Guidelines</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Minimum depth:</strong> 6 feet</li>
    <li><strong>Ideal depth:</strong> 7–8 feet or more</li>
    <li><strong>Daybed swings:</strong> 8+ feet recommended</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Porch Depth Matters</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Allows proper forward and backward swing motion</li>
    <li>Prevents contact with railings and walls</li>
    <li>Improves comfort and safety</li>
    <li>Supports larger swing sizes</li>
  </ul>

  <h2 style="color:#b80d0d;">Common Porch Depth Challenges</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Shallow porches limiting swing arc</li>
    <li>Doorways opening into swing path</li>
    <li>Railings reducing usable depth</li>
  </ul>

  <h2 style="color:#b80d0d;">Solutions for Limited Porch Depth</h2>
  <p style="font-size:16px;line-height:1.8;">
    For porches with limited depth,
    selecting a smaller swing or adjusting mounting height
    may improve fit.
    Professional guidance helps maximize usable space.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure if your porch is deep enough?</strong><br/>
    Doorplace USA can help evaluate
    your porch dimensions and recommend solutions.
  </div>

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

  <!-- Primary CTA Button -->
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
