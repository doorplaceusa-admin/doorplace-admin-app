type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingVsDaybedCostCityHTML({
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
            alt="Porch swing vs daybed swing cost in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    Porch Swing vs Daybed Swing Cost in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Homeowners in ${city}, ${state} often compare traditional porch swings
    with larger daybed porch swings when planning their outdoor space.
    Cost differences depend on size, materials, and installation needs.
  </p>

  <h2 style="color:#b80d0d;">Cost Comparison Overview</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Standard porch swings:</strong> $700 – $1,800 installed</li>
    <li><strong>Daybed porch swings:</strong> $2,000 – $4,000+ installed</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Daybed Swings Cost More</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Larger size and higher material volume</li>
    <li>Heavier-duty hardware and mounting</li>
    <li>Increased structural support requirements</li>
    <li>Additional labor for installation</li>
  </ul>

  <h2 style="color:#b80d0d;">Which Option Is Right for Your Space?</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch swings are ideal for smaller porches and lighter use,
    while daybed swings offer lounging comfort for larger spaces.
    The best option depends on your porch size, budget,
    and intended use.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure which swing fits your budget?</strong><br/>
    Doorplace USA can help compare options
    and recommend the best solution for your home.
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
