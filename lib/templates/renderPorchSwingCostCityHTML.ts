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
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

  <!-- ===================================================== -->
  <!-- ✅ HERO SECTION (Above Fold Conversion Block) -->
  <!-- ===================================================== -->

  ${
    heroImageUrl
      ? `
      <div style="text-align:center;margin-bottom:20px;">
        <img
          src="${heroImageUrl}"
          alt="Porch swing cost in ${city}, ${stateCode}"
          style="width:100%;max-width:650px;border-radius:10px;"
        />
      </div>
      `
      : ""
  }

  <h1 style="color:#b80d0d;font-size:36px;margin-bottom:10px;text-align:center;">
    How Much Does a Porch Swing Cost in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;text-align:center;max-width:750px;margin:0 auto;">
    Porch swing pricing in <strong>${city}, ${state}</strong> depends on size,
    materials, customization, and installation needs.
    Doorplace USA builds handcrafted swings designed for long-term outdoor comfort.
  </p>

  <!-- ✅ Quick Benefits -->
  <div style="margin-top:25px;display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Custom-built pricing (not store-bought)
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Nationwide delivery available
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Sizes from crib to queen
    </div>

  </div>

  <!-- ✅ Primary CTA Above Fold -->
  <div style="margin-top:30px;text-align:center;">
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
       style="background:#b80d0d;color:#fff;padding:15px 34px;
              font-size:18px;text-decoration:none;border-radius:8px;
              display:inline-block;font-weight:bold;">
      Request Pricing in ${city}
    </a>
  </div>

  <!-- ===================================================== -->
  <!-- ✅ MAIN CONTENT SECTION -->
  <!-- ===================================================== -->

  <div style="margin-top:45px;">

    <h2 style="color:#b80d0d;font-size:26px;">
      Average Porch Swing Cost in ${city}
    </h2>

    <p style="font-size:17px;line-height:1.8;">
      Porch swings in ${city}, ${state} can range widely depending on build quality.
      Mass-produced swings may cost less upfront, but custom porch swings offer
      superior durability, comfort, and long-term outdoor value.
    </p>

    <p style="font-size:17px;line-height:1.8;">
      Doorplace USA specializes in handcrafted porch swings that are built to last,
      making them a worthwhile investment for homeowners throughout ${state}.
    </p>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ MID-PAGE LEAD FORM BLOCK -->
  <!-- ===================================================== -->

  <div style="margin:45px 0;padding:25px;border:2px solid #b80d0d;
              border-radius:10px;background:#fff8f8;">

    <h2 style="margin-top:0;color:#b80d0d;">
      Get a Fast Quote in ${city}, ${stateCode}
    </h2>

    <p style="font-size:16px;line-height:1.7;">
      Tell us what size swing you're looking for and we’ll help you estimate pricing
      based on materials, upgrades, and delivery.
    </p>

    <div style="text-align:center;margin-top:20px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:12px 28px;
                font-size:17px;text-decoration:none;border-radius:6px;
                font-weight:bold;">
        Get My Quote
      </a>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ EXPERTISE CARDS -->
  <!-- ===================================================== -->

  <h2 style="color:#b80d0d;">
    What Affects Porch Swing Pricing?
  </h2>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
              gap:18px;margin-top:20px;">

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Wood Type</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        Pine is standard, while cedar and hardwood upgrades increase durability and cost.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Swing Size</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        Larger swings like twin, full, and daybed styles require more materials and labor.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Installation Needs</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        Some porches require reinforcement or custom mounting, affecting total cost.
      </p>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ FAQ SECTION (SEO BOOSTER) -->
  <!-- ===================================================== -->

  <div style="margin-top:55px;">

    <h2 style="color:#b80d0d;">
      Frequently Asked Questions About Porch Swing Cost
    </h2>

    <p style="font-size:16px;line-height:1.8;">
      <strong>How much does a custom porch swing cost?</strong><br>
      Custom swings typically cost more than store-bought models, but they last longer
      and are built for outdoor durability.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>Do you deliver porch swings to ${city}, ${stateCode}?</strong><br>
      Yes — Doorplace USA ships porch swings nationwide, including throughout ${state}.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>How long does it take to build a swing?</strong><br>
      Most swings are built within 14–21 business days depending on size and upgrades.
    </p>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ HELPFUL INTERNAL LINKS -->
  <!-- ===================================================== -->

  <div style="margin-top:55px;">

    <h2 style="color:#b80d0d;">
      Helpful Porch Swing Resources
    </h2>

    <ul style="line-height:1.9;font-size:16px;">

      <li>
        <a href="https://doorplaceusa.com/pages/porch-swings" style="color:#b80d0d;">
          Browse All Custom Porch Swings
        </a>
      </li>

      <li>
        <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">
          Stain Color Guide
        </a>
      </li>

      <li>
        <a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">
          Cushion Guide
        </a>
      </li>

      <li>
        <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">
          Porch Swing Installation Instructions
        </a>
      </li>

    </ul>

  </div>

  <!-- ===================================================== -->
  <!-- ✅ FINAL CTA -->
  <!-- ===================================================== -->

  <div style="margin-top:60px;text-align:center;">

    <h2 style="color:#b80d0d;">
      Ready to Get Porch Swing Pricing in ${city}?
    </h2>

    <p style="font-size:16px;line-height:1.7;max-width:700px;margin:0 auto;">
      Doorplace USA builds and ships custom porch swings nationwide.
      Request pricing today and we’ll help you choose the perfect swing setup.
    </p>

    <div style="margin-top:25px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:15px 34px;
                font-size:18px;text-decoration:none;border-radius:8px;
                display:inline-block;font-weight:bold;">
        Get a Fast Quote
      </a>
    </div>

  </div>

</div>
`;
}
