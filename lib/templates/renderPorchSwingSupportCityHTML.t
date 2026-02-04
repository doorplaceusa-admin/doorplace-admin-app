type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingSupportCityHTML({
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
            alt="Can my porch support a swing in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Can My Porch Support a Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    One of the most common questions homeowners in ${city}, ${state}
    ask before installing a porch swing is whether their porch
    can safely support the weight.
    The answer depends on structure, framing, and mounting location.
  </p>

  <h2 style="color:#b80d0d;">What a Porch Swing Needs to Be Supported</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Structural joists or beams (not just ceiling boards)</li>
    <li>Proper spacing between mounting points</li>
    <li>Load-rated hardware and anchors</li>
    <li>Enough clearance for swing motion</li>
  </ul>

  <h2 style="color:#b80d0d;">Signs Your Porch Can Support a Swing</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Exposed beams or accessible ceiling framing</li>
    <li>Solid wood joists (not decorative trim)</li>
    <li>No sagging, cracking, or movement under load</li>
    <li>Existing fixtures mounted directly to framing</li>
  </ul>

  <h2 style="color:#b80d0d;">When Reinforcement Is Required</h2>
  <p style="font-size:16px;line-height:1.8;">
    Many porches in ${city} homes require reinforcement
    before installing a porch swing.
    This is especially common with older homes, covered patios,
    or decorative porch ceilings.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Ceilings without accessible joists</li>
    <li>Lightweight or decorative structures</li>
    <li>Daybed or oversized porch swings</li>
    <li>Pergolas and gazebos not designed for hanging loads</li>
  </ul>

  <h2 style="color:#b80d0d;">Safe Alternatives If Your Porch Can’t Support a Swing</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Freestanding porch swing frames</li>
    <li>A-frame swing structures</li>
    <li>Custom pergola installations</li>
  </ul>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure about your porch structure?</strong><br/>
    Doorplace USA can review photos or measurements
    and recommend the safest installation option.
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
