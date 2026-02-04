type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  porchWidth?: number | null;
  heroImageUrl?: string | null;
};

export function renderWhatSizePorchSwingCityHTML({
  city,
  state,
  stateCode,
  porchWidth,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="What size porch swing fits my porch in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    What Size Porch Swing Fits My Porch in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Choosing the right porch swing size for your ${city}, ${state} home
    depends on porch width, clearance space, and how many people
    you want the swing to seat comfortably.
  </p>

  <h2 style="color:#b80d0d;">Common Porch Swing Sizes</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>4-foot swings:</strong> Ideal for compact porches or two people</li>
    <li><strong>5-foot swings:</strong> Most popular size for standard porches</li>
    <li><strong>6-foot swings:</strong> Best for wide porches or lounging comfort</li>
  </ul>

  <h2 style="color:#b80d0d;">Porch Width Guidelines</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Porch width should be at least 24 inches wider than the swing</li>
    <li>Side clearance of 12–18 inches improves comfort and safety</li>
    <li>Account for posts, railings, and walls</li>
  </ul>

  <h2 style="color:#b80d0d;">Seating & Comfort Considerations</h2>
  <p style="font-size:16px;line-height:1.8;">
    Larger swings provide more seating space
    but require stronger mounting support.
    Comfort, spacing, and clearance should be balanced.
  </p>

  <h2 style="color:#b80d0d;">Getting the Right Fit</h2>
  <p style="font-size:16px;line-height:1.8;">
    Measuring your porch before choosing a swing
    helps prevent clearance issues and installation challenges.
    Professional guidance can ensure the best fit.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Need help choosing the right size?</strong><br/>
    Doorplace USA can help recommend
    the ideal porch swing size for your space.
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
