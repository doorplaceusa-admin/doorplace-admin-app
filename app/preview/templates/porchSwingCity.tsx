type PorchSwingCityTemplateProps = {
  page: {
    id: string;
    title: string;
    slug: string;
    hero_image_url?: string | null;
  };
  location: {
    city_name: string;
    slug: string;
  };
  state: {
    state_name: string;
    state_code: string;
  };
};

export default function PorchSwingCityTemplate({
  page,
  location,
  state,
}: PorchSwingCityTemplateProps) {
  const city = location.city_name;
  const stateName = state.state_name;
  const stateCode = state.state_code;

  return (
    <div style={{ maxWidth: 850, margin: "0 auto", padding: 20, fontFamily: "Times New Roman, serif" }}>

      {/* HERO */}
      {page.hero_image_url && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src={page.hero_image_url}
            alt={`Porch swings in ${city}, ${stateName}`}
            style={{ width: "100%", maxWidth: 500, borderRadius: 8, display: "block", margin: "0 auto" }}
          />
        </div>
      )}

      {/* TITLE */}
      <h1 style={{ color: "#b80d0d", fontSize: 32, marginBottom: 15 }}>
        Porch Swings in {city}, {stateCode}
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        Looking for a handcrafted porch swing in <strong>{city}, {stateCode}</strong>?  
        Doorplace USA builds heavy-duty, comfort-focused wooden porch swings designed for real outdoor use — not flimsy showroom furniture.
      </p>

      {/* CTA */}
      <div style={{ background: "#f7f7f7", border: "1px solid #000", padding: 16, margin: "25px 0" }}>
        <strong>Get a fast quote:</strong><br />
        Use the live chat or visit  
        <a href="https://doorplaceusa.com/pages/get-a-fast-quote" target="_blank" style={{ marginLeft: 6 }}>
          Get a Fast Quote
        </a>
      </div>

      {/* WHY */}
      <h2 style={{ color: "#b80d0d", marginTop: 30 }}>
        Why {city} Homeowners Choose Doorplace USA
      </h2>

      <ul style={{ fontSize: 17, lineHeight: 1.7 }}>
        <li>Heavy-built porch swings — no hollow lumber</li>
        <li>Crib, twin, and full swing sizes</li>
        <li>Stain options designed for {stateName} climate</li>
        <li>Nationwide shipping with local guidance</li>
        <li>Live chat support & real humans</li>
      </ul>

      {/* SERVICES */}
      <h2 style={{ color: "#b80d0d", marginTop: 35 }}>Popular Porch Swing Locations</h2>
      <ul style={{ fontSize: 17 }}>
        <li>Front porches</li>
        <li>Covered patios</li>
        <li>Screened porches</li>
        <li>Backyard pergolas</li>
      </ul>

      {/* MATTRESS */}
      <h2 style={{ color: "#b80d0d", marginTop: 35 }}>Mattress Sizes (For Cushions)</h2>
      <ul>
        <li><strong>Crib:</strong> 27” × 51”</li>
        <li><strong>Twin:</strong> 38” × 75”</li>
        <li><strong>Full:</strong> 54” × 75”</li>
      </ul>

      {/* SWING SIZES */}
      <h2 style={{ color: "#b80d0d", marginTop: 25 }}>Swing Sizes</h2>
      <ul>
        <li><strong>Crib:</strong> 30” × 57”</li>
        <li><strong>Twin:</strong> 40” × 81”</li>
        <li><strong>Full:</strong> 57” × 81”</li>
      </ul>

      {/* RESOURCES */}
<h2 style={{ color: "#b80d0d", marginTop: 40 }}>Helpful Swing Resources</h2>

<ul style={{ fontSize: 16, lineHeight: 1.7 }}>
  <li>
    <a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style={{ color: "#b80d0d" }}>
      View Stain Colors Guide
    </a>
  </li>
  <li>
    <a href="https://doorplaceusa.com/pages/cushion-guide" style={{ color: "#b80d0d" }}>
      Swing Cushion Guide
    </a>
  </li>
  <li>
    <a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style={{ color: "#b80d0d" }}>
      Installation Instructions
    </a>
  </li>
  
</ul>


      {/* HOW IT WORKS */}
      <h2 style={{ color: "#b80d0d", marginTop: 40 }}>How Porch Swing Ordering Works</h2>
      <ol>
        <li>Select your swing style & size</li>
        <li>We confirm measurements and delivery details</li>
        <li>Your swing is built and shipped to your home</li>
      </ol>

      {/* FAQ */}
      <h2 style={{ color: "#b80d0d", marginTop: 40 }}>Frequently Asked Questions</h2>

      <p><strong>Do you ship to {city}?</strong><br />Yes — we ship nationwide, including all of {stateName}.</p>
      <p><strong>How long does delivery take?</strong><br />Most swings ship within 2–4 weeks depending on finish.</p>
      <p><strong>Do swings come with hanging hardware?</strong><br />Yes — all required mounting hardware is included.</p>
      <p><strong>Can I use my own installer?</strong><br />Yes — or we can help guide your installer.</p>

      {/* FINAL CTA */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <a
          href="https://doorplaceusa.com/pages/get-a-fast-quote"
          target="_blank"
          style={{
            background: "#b80d0d",
            color: "#fff",
            padding: "14px 30px",
            fontSize: 18,
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Get a Fast Quote
        </a>
      </div>

      {/* FOOTER SEO */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ color: "#b80d0d" }}>
          Porch Swings in {city} and Across {stateName}
        </h3>
        <p>
          Doorplace USA serves customers throughout {stateName}. Whether you’re in {city} or a nearby area, we can help you build the perfect porch swing.
        </p>
      </div>

    </div>
  );
}
