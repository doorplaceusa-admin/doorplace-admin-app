export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>

        <p style={{ color: "#666", marginBottom: "30px", lineHeight: 1.7 }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Overview</h2>
          <p style={pStyle}>
            This Privacy Policy explains how TradePilot (“we,” “us,” or “our”)
            collects, uses, and protects information when you visit our website
            or submit forms requesting information about our services.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Information We Collect</h2>
          <p style={pStyle}>
            We may collect information you voluntarily provide through forms,
            including:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Name</li>
            <li style={liStyle}>Email address</li>
            <li style={liStyle}>Phone number</li>
            <li style={liStyle}>Business type and website</li>
            <li style={liStyle}>Service area and page volume requests</li>
          </ul>
          <p style={pStyle}>
            We may also collect basic usage data (like page visits) to improve
            site performance and user experience.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>How We Use Your Information</h2>
          <ul style={ulStyle}>
            <li style={liStyle}>
              To respond to requests, questions, or service inquiries
            </li>
            <li style={liStyle}>
              To provide pricing, rollout planning, and onboarding instructions
            </li>
            <li style={liStyle}>
              To improve our website and service experience
            </li>
            <li style={liStyle}>
              To communicate service updates when relevant (you can opt out)
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Sharing of Information</h2>
          <p style={pStyle}>
            We do not sell your personal information. We may share information
            only when necessary to operate our service (for example, with
            infrastructure providers) or when required by law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Data Security</h2>
          <p style={pStyle}>
            We take reasonable steps to protect your information. However, no
            online system can be guaranteed 100% secure.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Your Choices</h2>
          <p style={pStyle}>
            You can request access, updates, or deletion of your submitted
            information by contacting us. You can also opt out of non-essential
            communications at any time.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            If you have questions about this Privacy Policy, contact us at:
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

        <p style={{ marginTop: "50px", color: "#777", fontSize: "14px" }}>
          TradePilot © {new Date().getFullYear()}
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
