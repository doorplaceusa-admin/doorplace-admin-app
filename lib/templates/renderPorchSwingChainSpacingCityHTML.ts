type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingChainSpacingCityHTML({
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
            alt="Porch swing chain spacing in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Far Apart Should Porch Swing Chains Be in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Proper chain spacing is essential for stable, comfortable porch swing use in
    ${city}, ${state}. Incorrect spacing can cause twisting, uneven motion,
    and excess stress on mounting hardware.
  </p>

  <h2 style="color:#b80d0d;">Recommended Chain Spacing</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Chains should align closely with the swing’s width</li>
    <li>Most swings perform best when chains are mounted near the outer edges</li>
    <li>Wider spacing improves stability and reduces sway</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Chain Spacing Matters</h2>
  <p style="font-size:16px;line-height:1.8;">
    Proper spacing distributes weight evenly across the swing and mounting points.
    This helps prevent twisting and ensures smooth front-to-back movement.
  </p>

  <h2 style="color:#b80d0d;">Common Chain Spacing Mistakes</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Mounting chains too close together</li>
    <li>Uneven spacing from left to right</li>
    <li>Ignoring swing width when placing hardware</li>
    <li>Improper chain angles causing instability</li>
  </ul>

  <h2 style="color:#b80d0d;">Adjusting Chain Spacing for Comfort</h2>
  <p style="font-size:16px;line-height:1.8;">
    Minor adjustments to chain placement and length can significantly improve
    swing comfort and balance. Professional installers often fine-tune spacing
    during final setup.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Need help dialing in your porch swing setup?</strong><br/>
    Doorplace USA can assist with chain spacing,
    hardware selection, and installation guidance.
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
