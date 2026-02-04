type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingCostCityHTML({
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
            alt="Porch swing cost in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Much Does a Porch Swing Cost in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Porch swing pricing in ${city}, ${state} can vary based on size, materials,
    customization, and installation requirements.
    Understanding these cost factors helps homeowners plan and budget confidently.
  </p>

  <h2 style="color:#b80d0d;">Average Porch Swing Cost</h2>
  <p style="font-size:16px;line-height:1.8;">
    Most porch swings fall within a broad price range depending on construction quality
    and design. Custom-built porch swings typically cost more than store-bought options,
    but offer superior durability, comfort, and long-term value.
  </p>

  <h2 style="color:#b80d0d;">What Affects Porch Swing Pricing?</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Wood type (pine, cedar, oak, or hardwood)</li>
    <li>Swing size and weight capacity</li>
    <li>Custom design and finish options</li>
    <li>Hanging hardware and mounting method</li>
    <li>Delivery and installation needs</li>
  </ul>

  <h2 style="color:#b80d0d;">Installation Cost vs Swing Cost</h2>
  <p style="font-size:16px;line-height:1.8;">
    In ${city}, installation costs can vary depending on porch structure,
    beam reinforcement requirements, and mounting location.
    Some homes may need additional support, which can affect total cost.
  </p>

  <h2 style="color:#b80d0d;">Is a Porch Swing Worth the Cost?</h2>
  <p style="font-size:16px;line-height:1.8;">
    A high-quality porch swing adds long-term enjoyment, comfort, and visual appeal.
    Custom porch swings are designed for outdoor use and often outlast
    mass-produced patio furniture.
  </p>

  <div style="border-top:1px solid #ccc;margin-top:30px;padding-top:20px;">
    <p style="font-weight:bold;font-size:16px;">
      Looking for custom porch swing pricing in ${city}, ${stateCode}?
    </p>
    <p style="font-size:16px;">
      Doorplace USA builds and ships custom porch swings nationwide and can help you
      choose the right size, materials, and setup for your space.
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
