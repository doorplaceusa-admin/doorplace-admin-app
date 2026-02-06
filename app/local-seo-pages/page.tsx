"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LocalSEOPages() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8f9fb, #ffffff)",
        padding: "90px 20px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* ===========================
            HERO SECTION
        =========================== */}
        <section
          style={{
            textAlign: "center",
            padding: "70px 35px",
            borderRadius: "22px",
            background: "white",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 900,
              marginBottom: "20px",
              lineHeight: 1.05,
            }}
          >
            Launch Thousands of Local SEO Pages <br />
            and Start Getting More Leads
          </h1>

          <p
            style={{
              fontSize: "20px",
              color: "#444",
              maxWidth: "760px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            TradePilot is an automated publishing engine that generates
            high-quality city + service landing pages for contractors and local
            businesses — helping you rank in Google without paying Angi or
            overpriced agencies.
          </p>

          <div style={{ marginTop: "40px" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: "inline-block",
                padding: "18px 34px",
                borderRadius: "12px",
                background: "black",
                color: "white",
                fontSize: "18px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Get More Information →
            </button>
          </div>

          <p style={{ marginTop: "18px", fontSize: "14px", color: "#777" }}>
            Built for real businesses. Deployed fast. Scales instantly.
          </p>
        </section>

        {/* ===========================
            WHY THIS WORKS
        =========================== */}
        <section style={{ marginTop: "90px" }}>
          <h2
            style={{
              fontSize: "38px",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Why Local SEO Pages Matter
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "850px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Most contractors only have 5–10 pages on their website. TradePilot
            allows you to instantly expand into hundreds of cities, suburbs, and
            service areas — creating an SEO footprint that captures search
            traffic and turns it into leads.
          </p>
        </section>

        {/* ===========================
            FEATURES GRID
        =========================== */}
        <section style={{ marginTop: "70px" }}>
          <h2
            style={{
              fontSize: "34px",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "45px",
            }}
          >
            What TradePilot Builds For You
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "22px",
            }}
          >
            {[
              "City + Service Landing Pages",
              "Instant SEO Footprint Expansion",
              "Custom Templates for Your Business",
              "Fast Publishing + Deployment",
              "Sitemap + Indexing Support",
              "Optional Tracking Dashboard",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "white",
                  padding: "26px",
                  borderRadius: "16px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                  fontSize: "16px",
                  fontWeight: 650,
                }}
              >
                ✅ {item}
              </div>
            ))}
          </div>
        </section>

        {/* ===========================
            WHO THIS IS FOR
        =========================== */}
        <section style={{ marginTop: "100px" }}>
          <h2
            style={{
              fontSize: "38px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Who TradePilot Pages Are For
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "850px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            TradePilot is built for real local service businesses that want more
            inbound leads from Google. If customers search for your service in
            different cities, TradePilot helps you show up everywhere.
          </p>

          <div
            style={{
              marginTop: "50px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "18px",
            }}
          >
            {[
              "Garage Door Companies",
              "Custom Door & Entry Installers",
              "Fence & Gate Contractors",
              "Roofing Companies",
              "Concrete & Driveway Pros",
              "Power Washing Businesses",
              "HVAC & Air Conditioning",
              "Plumbing Companies",
              "Electricians",
              "Tree Service & Landscaping",
              "Pool Builders & Pool Cleaning",
              "Pest Control Companies",
              "Window & Glass Installers",
              "Flooring Contractors",
              "Kitchen Remodelers",
              "Bathroom Remodelers",
              "Painters & Drywall Companies",
              "Moving & Junk Removal Services",
              "Handyman Businesses",
              "Any Local Contractor Expanding Cities",
            ].map((biz) => (
              <div
                key={biz}
                style={{
                  background: "white",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                  fontSize: "16px",
                  fontWeight: 650,
                }}
              >
                🔥 {biz}
              </div>
            ))}
          </div>
        </section>

        {/* ===========================
            PRICING SECTION
        =========================== */}
        <section style={{ marginTop: "100px" }}>
          <h2
            style={{
              fontSize: "44px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            Simple Pricing Based on Page Volume
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              marginBottom: "60px",
            }}
          >
            Start small, grow anytime. Most customers begin with the Starter or
            Growth pack — then scale into thousands of pages.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: "25px",
            }}
          >
            <PricingCard title="Starter Pack" price="$99" subtitle="50 Pages" />
            <PricingCard
              title="Growth Pack ⭐"
              price="$249"
              subtitle="250 Pages"
              highlight
            />
            <PricingCard
              title="Expansion Pack"
              price="$799"
              subtitle="1,000 Pages"
            />
            <PricingCard
              title="Domination Pack"
              price="$1,499"
              subtitle="3,000 Pages"
            />
            <PricingCard
              title="Enterprise Rollout"
              price="Custom"
              subtitle="10,000+ Pages"
            />
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          style={{
            marginTop: "110px",
            textAlign: "center",
            padding: "75px 35px",
            borderRadius: "22px",
            background: "black",
            color: "white",
          }}
        >
          <h2 style={{ fontSize: "40px", fontWeight: 900 }}>
            Ready to Get Started?
          </h2>

          <p style={{ fontSize: "18px", marginTop: "15px", opacity: 0.9 }}>
            Click below and submit your info — we’ll reach out with next steps.
          </p>

          <button
            onClick={() => setShowForm(true)}
            style={{
              marginTop: "25px",
              padding: "18px 36px",
              borderRadius: "12px",
              background: "white",
              color: "black",
              fontSize: "18px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
            }}
          >
            Request Info Now →
          </button>
        </section>

        {/* FOOTER */}
        <p style={{ textAlign: "center", marginTop: "60px", color: "#777" }}>
          TradePilot © {new Date().getFullYear()}
        </p>

        {/* MODAL FORM */}
        {showForm && <LeadModal onClose={() => setShowForm(false)} />}
      </div>
    </main>
  );
}

/* ===========================
   PRICING CARD
=========================== */

function PricingCard({
  title,
  price,
  subtitle,
  highlight = false,
}: {
  title: string;
  price: string;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "black" : "white",
        color: highlight ? "white" : "black",
        borderRadius: "18px",
        padding: "30px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        transform: highlight ? "scale(1.04)" : "none",
      }}
    >
      <h3 style={{ fontSize: "20px", fontWeight: 800 }}>{title}</h3>
      <p style={{ fontSize: "34px", fontWeight: 900 }}>{price}</p>
      <p style={{ opacity: 0.8 }}>{subtitle}</p>
    </div>
  );
}

/* ===========================
   MODAL FORM
=========================== */

function LeadModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
  full_name: "",
  email: "",
  phone: "",
  business_type: "",
  business_website: "",
  street_address: "",
  city: "",
  state: "",
  zip: "",
  pages_needed: "",
});

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd",
};



  async function submit() {
  let website = form.business_website.trim();

  // Auto-add https:// if missing
  if (website && !website.startsWith("http")) {
    website = "https://" + website;
  }

  const cleanForm = {
    ...form,
    business_website: website,
  };

  await supabase.from("tradepilot_page_requests").insert([cleanForm]);

  alert("Submitted! We'll contact you shortly.");
  onClose();
}


  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "18px",
          width: "95%",
          maxWidth: "520px",
        }}
      >
        <h2 style={{ fontSize: "26px", fontWeight: 900 }}>
          Request TradePilot Pages
        </h2>

        <input
  placeholder="Full Name"
  value={form.full_name}
  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="Email Address"
  value={form.email}
  onChange={(e) => setForm({ ...form, email: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="Phone Number"
  value={form.phone}
  onChange={(e) => setForm({ ...form, phone: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="Business Type (ex: Roofing, HVAC, Plumbing)"
  value={form.business_type}
  onChange={(e) => setForm({ ...form, business_type: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="Business Website (ex: https://yourcompany.com)"
  value={form.business_website}
  onChange={(e) => setForm({ ...form, business_website: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="City"
  value={form.city}
  onChange={(e) => setForm({ ...form, city: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="State"
  value={form.state}
  onChange={(e) => setForm({ ...form, state: e.target.value })}
  style={inputStyle}
/>

<input
  placeholder="How many pages do you need? (ex: 500, 5,000, 50,000)"
  value={form.pages_needed}
  onChange={(e) => setForm({ ...form, pages_needed: e.target.value })}
  style={inputStyle}
/>


        <button
          onClick={submit}
          style={{
            width: "100%",
            marginTop: "18px",
            padding: "14px",
            borderRadius: "10px",
            background: "black",
            color: "white",
            fontWeight: 800,
            border: "none",
          }}
        >
          Submit Request
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "white",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
