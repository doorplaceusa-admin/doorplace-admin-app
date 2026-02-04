type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  mountType: "ceiling" | "beam" | "pergola";
  heroImageUrl?: string | null;
};

export function renderPorchSwingMountTypeCityHTML({
  city,
  state,
  stateCode,
  mountType,
  heroImageUrl,
}: RenderProps): string {

  const mountLabel =
    mountType === "ceiling"
      ? "Ceiling"
      : mountType === "beam"
      ? "Beam"
      : "Pergola";

  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="Porch swing mounted from a ${mountLabel.toLowerCase()} in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How to Hang a Porch Swing From a ${mountLabel} in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Hanging a porch swing from a ${mountLabel.toLowerCase()} in ${city}, ${state}
    requires proper structural support and mounting hardware.
    Each mounting method has unique requirements that affect safety and performance.
  </p>

  <h2 style="color:#b80d0d;">${mountLabel}-Mounted Porch Swing Requirements</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Direct attachment to structural framing</li>
    <li>Load-rated hardware appropriate for swing weight</li>
    <li>Proper spacing and alignment for smooth motion</li>
    <li>Outdoor-rated fasteners and connectors</li>
  </ul>

  <h2 style="color:#b80d0d;">Common Mistakes With ${mountLabel} Mounting</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Attaching to decorative or non-structural wood</li>
    <li>Using undersized or non-rated hardware</li>
    <li>Incorrect spacing between mounting points</li>
    <li>Ignoring swing clearance requirements</li>
  </ul>

  <h2 style="color:#b80d0d;">When Reinforcement Is Needed</h2>
  <p style="font-size:16px;line-height:1.8;">
    Many ${mountLabel.toLowerCase()} installations in ${city}
    require reinforcement to safely support a porch swing,
    especially for larger or daybed swings.
  </p>

  <h2 style="color:#b80d0d;">Professional Installation Considerations</h2>
  <p style="font-size:16px;line-height:1.8;">
    Professional installation helps ensure the swing is mounted correctly,
    balanced properly, and supported for long-term use.
    This is often recommended for pergolas and custom structures.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure if your ${mountLabel.toLowerCase()} can support a swing?</strong><br/>
    Doorplace USA can help review your setup
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
