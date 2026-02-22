type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  heroImageUrl?: string | null;
  nearbyCities?: CityLink[];
};

export function renderInteriorDoorInstallationCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
  nearbyCities,
}: RenderProps): string {
  return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

  <!-- ===================================================== -->
  <!-- HERO SECTION -->
  <!-- ===================================================== -->

  ${
    heroImageUrl
      ? `
      <div style="text-align:center;margin-bottom:20px;">
        <img
          src="${heroImageUrl}"
          alt="Interior door installation in ${city}, ${stateCode}"
          style="width:100%;max-width:650px;border-radius:10px;"
        />
      </div>
      `
      : ""
  }

  <h1 style="color:#b80d0d;font-size:36px;margin-bottom:10px;text-align:center;">
    Professional Interior Door Installation in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;text-align:center;max-width:750px;margin:0 auto;">
    Doorplace USA provides custom-built and professionally installed interior doors
    for homeowners in ${city}, ${state}. Every door is measured,
    crafted, and installed for a precise fit and long-term performance.
  </p>

  <!-- Benefits Row -->
  <div style="margin-top:25px;display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Precision-measured installations
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Solid wood & solid core upgrades
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Serving Dallas–Fort Worth
    </div>

  </div>

  <!-- Primary CTA -->
  <div style="margin-top:30px;text-align:center;">
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
       style="background:#b80d0d;color:#fff;padding:15px 34px;
              font-size:18px;text-decoration:none;border-radius:8px;
              display:inline-block;font-weight:bold;">
      Request Interior Door Pricing in ${city}
    </a>
  </div>

  <!-- ===================================================== -->
  <!-- MAIN CONTENT -->
  <!-- ===================================================== -->

  <div style="margin-top:45px;">

    <h2 style="color:#b80d0d;font-size:26px;">
      Interior Doors We Install in ${city}
    </h2>

    <p style="font-size:17px;line-height:1.8;">
      We install a wide range of interior doors for bedrooms, bathrooms,
      offices, closets, and room dividers throughout ${state}.
      Every installation is completed with careful alignment,
      proper shimming, and clean finish work.
    </p>

    <ul style="line-height:1.9;font-size:16px;">
      <li>Bedroom and bathroom doors</li>
      <li>Solid core sound-reduction upgrades</li>
      <li>French interior doors</li>
      <li>Sliding and barn door systems</li>
      <li>Double and wide-span interior doors</li>
      <li>Custom-sized interior doors</li>
    </ul>

  </div>

  <!-- ===================================================== -->
  <!-- MID-PAGE QUOTE BLOCK -->
  <!-- ===================================================== -->

  <div style="margin:45px 0;padding:25px;border:2px solid #b80d0d;
              border-radius:10px;background:#fff8f8;">

    <h2 style="margin-top:0;color:#b80d0d;">
      Ready to Upgrade Your Interior Doors?
    </h2>

    <p style="font-size:16px;line-height:1.7;">
      Send us a photo and rough measurements of your opening in ${city}.
      We’ll help you choose the right door style and provide a fast quote.
    </p>

    <div style="text-align:center;margin-top:20px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:12px 28px;
                font-size:17px;text-decoration:none;border-radius:6px;
                font-weight:bold;">
        Get My Interior Door Quote
      </a>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- WHY REPLACE INTERIOR DOORS -->
  <!-- ===================================================== -->

  <h2 style="color:#b80d0d;">
    Why Homeowners in ${city} Replace Interior Doors
  </h2>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Upgrade from hollow core builder-grade doors</li>
    <li>Improve sound control with solid core doors</li>
    <li>Replace warped or misaligned doors</li>
    <li>Modernize outdated trim and panel styles</li>
    <li>Add sliding or double door functionality</li>
  </ul>

  <!-- ===================================================== -->
  <!-- EXPERTISE GRID -->
  <!-- ===================================================== -->

  <h2 style="color:#b80d0d;margin-top:40px;">
    Why Doorplace USA Interior Doors Stand Out
  </h2>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
              gap:18px;margin-top:20px;">

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Custom Built Fit</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        Every door is sized and built specifically for your opening.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Hardware Precision</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        We align hardware and tracks to ensure smooth operation.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Professional Installation</strong>
      <p style="margin-top:8px;font-size:15px;line-height:1.6;">
        Installed cleanly and securely for long-term performance.
      </p>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- FAQ SECTION -->
  <!-- ===================================================== -->

  <div style="margin-top:55px;">

    <h2 style="color:#b80d0d;">
      Frequently Asked Questions
    </h2>

    <p style="font-size:16px;line-height:1.8;">
      <strong>Do you replace hollow core doors in ${city}?</strong><br>
      Yes — we upgrade builder-grade hollow core doors to solid core or custom-built options.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>Do you install sliding or barn-style interior doors?</strong><br>
      Yes. We build and install custom sliding and barn door systems.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>How long does interior door installation take?</strong><br>
      Most single door installations are completed within one visit.
    </p>

  </div>

  <!-- ===================================================== -->
  <!-- NEARBY CITIES -->
  <!-- ===================================================== -->

  ${
    nearbyCities && nearbyCities.length > 0
      ? `
      <div style="margin-top:55px;">
        <h2 style="color:#b80d0d;">
          Nearby Areas We Also Serve
        </h2>

        <ul style="line-height:1.9;font-size:16px;padding-left:18px;">
          ${nearbyCities
            .slice(0, 8)
            .map(
              (c) => `
              <li>
                <a href="https://doorplaceusa.com/pages/${c.slug}"
                   style="color:#b80d0d;">
                  Interior Door Installation in ${c.city}
                </a>
              </li>
              `
            )
            .join("")}
        </ul>
      </div>
      `
      : ""
  }

  <!-- ===================================================== -->
  <!-- FINAL CTA -->
  <!-- ===================================================== -->

  <div style="margin-top:60px;text-align:center;">

    <h2 style="color:#b80d0d;">
      Upgrade Your Interior Doors in ${city}
    </h2>

    <p style="font-size:16px;line-height:1.7;max-width:700px;margin:0 auto;">
      Doorplace USA provides expert craftsmanship and professional installation
      for interior doors across ${state}.
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