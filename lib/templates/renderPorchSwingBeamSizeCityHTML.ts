type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingBeamSizeCityHTML({
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
            alt="Porch swing beam size requirements in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    What Size Beam Is Needed for a Porch Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Choosing the correct beam size is critical when installing a porch swing in
    ${city}, ${state}. The beam must safely support both the static weight of the
    swing and the dynamic load created by swinging motion.
  </p>

  <h2 style="color:#b80d0d;">Minimum Beam Size Guidelines</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>4x4 beams:</strong> Not recommended for porch swings</li>
    <li><strong>4x6 beams:</strong> Minimum size for smaller swings (with proper support)</li>
    <li><strong>6x6 beams:</strong> Preferred for standard and heavy-duty swings</li>
    <li><strong>Laminated or engineered beams:</strong> Often ideal for higher loads</li>
  </ul>

  <h2 style="color:#b80d0d;">Factors That Affect Beam Requirements</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Swing size and total weight capacity</li>
    <li>Distance between mounting points</li>
    <li>Beam span and support points</li>
    <li>Type of wood or engineered material</li>
    <li>Existing porch construction</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Larger Beams Are Safer</h2>
  <p style="font-size:16px;line-height:1.8;">
    Larger beams distribute weight more effectively and reduce flexing during use.
    This is especially important for porch swings installed in ${city}
    homes where weather exposure and long-term wear are factors.
  </p>

  <h2 style="color:#b80d0d;">When Beam Reinforcement Is Needed</h2>
  <p style="font-size:16px;line-height:1.8;">
    If your existing beam is undersized or spans too far without support,
    reinforcement may be required before installing a porch swing.
    Reinforcement can include adding support posts, sistering beams,
    or installing engineered supports.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure if your beam is strong enough?</strong><br/>
    Doorplace USA can help evaluate your porch structure
    and recommend safe mounting solutions.
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
