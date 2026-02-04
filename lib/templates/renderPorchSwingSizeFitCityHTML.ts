type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingSizeFitCityHTML({
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
            alt="Porch swing size and fit guide in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Porch Swing Size & Fit Guide for ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Choosing the correct porch swing size for your ${city}, ${state} home
    is essential for comfort, safety, and proper clearance.
    This guide helps homeowners understand sizing, spacing, and fit considerations.
  </p>

  <h2 style="color:#b80d0d;">Common Porch Swing Sizes</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>4-foot swings:</strong> Ideal for smaller porches or single seating</li>
    <li><strong>5-foot swings:</strong> Most popular size for two adults</li>
    <li><strong>6-foot swings:</strong> Extra seating and lounging space</li>
    <li><strong>Daybed swings:</strong> Designed for reclining and wider spans</li>
  </ul>

  <h2 style="color:#b80d0d;">How Much Space Does a Porch Swing Need?</h2>
  <p style="font-size:16px;line-height:1.8;">
    Proper clearance ensures smooth swing motion and prevents contact with walls or railings.
    Most porch swings require additional space on each side and behind the swing.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>12–18 inches of clearance on each side</li>
    <li>14–24 inches of clearance behind the swing</li>
    <li>Enough overhead clearance for chains or rope</li>
  </ul>

  <h2 style="color:#b80d0d;">Weight Capacity & Structural Support</h2>
  <p style="font-size:16px;line-height:1.8;">
    Swing size affects total weight load.
    Larger swings require stronger mounting points and reinforced support beams.
    Porch structure evaluation is especially important for older homes in ${city}.
  </p>

  <h2 style="color:#b80d0d;">Finding the Right Fit for Your Porch</h2>
  <p style="font-size:16px;line-height:1.8;">
    The best porch swing size balances available space, seating needs,
    and the structural layout of your porch or patio.
    Custom sizing is often recommended when standard sizes don’t fit correctly.
  </p>

  <div style="border-top:1px solid #ccc;margin-top:30px;padding-top:20px;">
    <p style="font-weight:bold;font-size:16px;">
      Need help choosing the right porch swing size in ${city}, ${stateCode}?
    </p>
    <p style="font-size:16px;">
      Doorplace USA can help you select the correct swing size,
      spacing, and mounting setup for your specific porch.
    </p>
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="display:inline-block;margin-top:12px;padding:12px 22px;background:#b80d0d;color:#fff;text-decoration:none;border-radius:6px;font-size:17px;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}
