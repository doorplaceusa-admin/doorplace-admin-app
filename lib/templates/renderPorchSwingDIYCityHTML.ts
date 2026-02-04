type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingDIYCityHTML({
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
            alt="DIY porch swing installation in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Can You Install a Porch Swing Yourself in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Many homeowners in ${city}, ${state} consider installing a porch swing themselves.
    While DIY installation is possible in some situations, safety depends on proper
    structure, hardware, and installation technique.
  </p>

  <h2 style="color:#b80d0d;">When DIY Installation May Be Possible</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Accessible structural joists or beams</li>
    <li>Standard-sized porch swing</li>
    <li>Load-rated hardware and tools available</li>
    <li>Comfort working overhead</li>
  </ul>

  <h2 style="color:#b80d0d;">Risks of DIY Porch Swing Installation</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Mounting into non-structural wood</li>
    <li>Incorrect spacing or hanging height</li>
    <li>Underrated hardware failure</li>
    <li>Structural damage to porch framing</li>
  </ul>

  <h2 style="color:#b80d0d;">When Professional Installation Is Recommended</h2>
  <p style="font-size:16px;line-height:1.8;">
    Professional installation is recommended for larger swings,
    daybed swings, pergola installations,
    or when reinforcement is required.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Unsure if DIY is right for your porch?</strong><br/>
    Doorplace USA can help determine the safest installation option.
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
