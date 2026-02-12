export const dynamic = "force-dynamic";

export default function TermsOfServicePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8f9fb, #ffffff)",
        padding: "90px 20px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "44px", fontWeight: 900, marginBottom: "12px" }}>
          Terms of Service
        </h1>

        <p style={{ color: "#666", marginBottom: "30px", lineHeight: 1.7 }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Overview</h2>
          <p style={pStyle}>
            These Terms of Service (“Terms”) govern your use of TradePilot and
            our website. By using our site or requesting services, you agree to
            these Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Service Description</h2>
          <p style={pStyle}>
            TradePilot provides local SEO page generation and publishing services
            (including Shopify page publishing) and may offer optional monitoring
            or support services depending on your plan.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>No Guarantee of Google Indexing or Rankings</h2>
          <p style={pStyle}>
            We build and publish pages in a way designed to help your business
            appear in search engines. However, search engines (including Google)
            control indexing and rankings. We do not guarantee that any page will
            be indexed, ranked, or generate any specific amount of traffic or
            leads.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Page Ownership</h2>
          <p style={pStyle}>
            Once pages are created and published to your website platform (such
            as your Shopify account), those published pages belong to you and
            remain on your website unless you remove them.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Fees and Billing</h2>
          <p style={pStyle}>
            Services may include a one-time build fee (often based on page
            quantity) and optional recurring fees for monitoring, maintenance, or
            expansion services. Specific pricing will be provided before work
            begins.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Client Responsibilities</h2>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Provide accurate business details and target service locations
            </li>
            <li style={liStyle}>
              Maintain access to required platforms (example: Shopify admin)
            </li>
            <li style={liStyle}>
              Review and approve rollout details when requested
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Acceptable Use</h2>
          <p style={pStyle}>
            You agree not to use our services for unlawful, misleading, or
            abusive content. We may refuse service if requested content violates
            platform rules or applicable laws.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Limitation of Liability</h2>
          <p style={pStyle}>
            To the maximum extent permitted by law, TradePilot will not be liable
            for indirect, incidental, special, or consequential damages, or for
            loss of profits, revenue, traffic, or rankings.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Changes to These Terms</h2>
          <p style={pStyle}>
            We may update these Terms from time to time. Continued use of the
            site after updates means you accept the updated Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            Questions about these Terms can be sent to:
          </p>
          <div
            style={{
              background: "white",
              border: "1px solid #eee",
              borderRadius: "14px",
              padding: "18px",
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontWeight: 800 }}>TradePilot</div>
            <div>Email: support@tradepilot.doorplaceusa.com</div>
          </div>
        </section>

        <p style={{ textAlign: "center", marginTop: "60px", color: "#777" }}>
  TradePilot © {new Date().getFullYear()} ·{" "}
  <a href="/privacy" style={{ color: "#777", textDecoration: "underline" }}>
    Privacy
  </a>{" "}
  ·{" "}
  <a href="/terms" style={{ color: "#777", textDecoration: "underline" }}>
    Terms
  </a>
</p>

      </div>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "18px",
  padding: "26px",
  boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
  marginBottom: "18px",
};

const h2Style: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 900,
  marginBottom: "10px",
};

const pStyle: React.CSSProperties = {
  color: "#444",
  lineHeight: 1.8,
  margin: 0,
};

const ulStyle: React.CSSProperties = {
  marginTop: "10px",
  marginBottom: "0px",
  paddingLeft: "20px",
  color: "#444",
  lineHeight: 1.8,
};

const liStyle: React.CSSProperties = {
  marginBottom: "6px",
};
