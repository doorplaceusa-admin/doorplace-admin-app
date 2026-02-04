type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingHardwareCityHTML({
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
            alt="Porch swing hardware and mounting in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    What Hardware Is Needed for a Porch Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Using the correct hardware is critical for safe porch swing installation in
    ${city}, ${state}. The right mounting components ensure proper load support,
    smooth movement, and long-term durability in outdoor conditions.
  </p>

  <h2 style="color:#b80d0d;">Essential Porch Swing Hardware</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Heavy-duty eye bolts or swing hangers rated for load</li>
    <li>Lag bolts or through-bolts installed into structural framing</li>
    <li>Galvanized or stainless steel hardware for outdoor use</li>
    <li>Washers and locking nuts to prevent loosening</li>
  </ul>

  <h2 style="color:#b80d0d;">Chains vs Rope</h2>
  <p style="font-size:16px;line-height:1.8;">
    Porch swings are typically hung using chain or rope.
    Chains offer adjustability and strength, while rope provides a softer,
    decorative appearance. Both options must be rated for the swing’s weight.
  </p>

  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Chain:</strong> Adjustable, durable, and commonly used</li>
    <li><strong>Rope:</strong> Decorative, must be outdoor-rated and reinforced</li>
  </ul>

  <h2 style="color:#b80d0d;">Mounting Into the Right Structure</h2>
  <p style="font-size:16px;line-height:1.8;">
    Hardware must be installed directly into ceiling joists, beams,
    or structural headers. Decorative boards or ceiling panels
    are not suitable for supporting porch swing loads.
  </p>

  <h2 style="color:#b80d0d;">Why Hardware Quality Matters</h2>
  <p style="font-size:16px;line-height:1.8;">
    Low-quality or improperly rated hardware can loosen, bend,
    or fail over time. Professional-grade hardware reduces movement,
    improves safety, and extends the life of your porch swing installation.
  </p>

  <div style="border-top:1px solid #ccc;margin-top:30px;padding-top:20px;">
    <p style="font-weight:bold;font-size:16px;">
      Need help choosing the right porch swing hardware in ${city}, ${stateCode}?
    </p>
    <p style="font-size:16px;">
      Doorplace USA can help you select proper mounting hardware
      and installation options based on your porch structure.
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
