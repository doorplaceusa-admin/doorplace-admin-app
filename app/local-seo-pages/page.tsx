"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ✅ IMPORT YOUR LIVE MAP COMPONENT */
import LiveUSMap from "@/app/components/LiveUSMap";

export const dynamic = "force-dynamic";


export default function LocalSEOPages() {
  const [showForm, setShowForm] = useState(false);
// ✅ Screenshot Modal State
const [activeShot, setActiveShot] = useState<string | null>(null);

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
            HERO SECTION (NEW HOOK)
        =========================== */}
        <section
          style={{
            textAlign: "center",
            padding: "80px 35px",
            borderRadius: "22px",
            background: "white",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 900,
              marginBottom: "18px",
              lineHeight: 1.05,
            }}
          >
            Local SEO Pages for Small Businesses <br />
            Who Want a Real Shot at More Customers
          </h1>

          <p
            style={{
              fontSize: "20px",
              color: "#444",
              maxWidth: "820px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            If you're building a business, trying to get more calls, more
            customers, and more income — TradePilot helps you show up in Google
            across dozens (or thousands) of cities without paying expensive SEO
            agencies.
          </p>

          <div style={{ marginTop: "35px" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "18px 36px",
                borderRadius: "12px",
                background: "#000",
                color: "white",
                fontSize: "18px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              Request Info → Let’s Build Your Pages
            </button>
          </div>

          <p style={{ marginTop: "18px", fontSize: "14px", color: "#777" }}>
            No confusing contracts. No agency retainers. Built for real small
            businesses.
          </p>

          {/* ===========================
    INSTANT PROOF STRIP (NEW)
=========================== */}
<div
  style={{
    marginTop: "45px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
    maxWidth: "950px",
    marginLeft: "auto",
    marginRight: "auto",
  }}
>
  {/* Proof Card 1 */}
  <div
    style={{
      background: "#f8f9fb",
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      fontWeight: 800,
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    }}
  >
    🚀 Pages Published Fast  
    <p style={{ marginTop: "6px", fontWeight: 500, fontSize: "14px", color: "#555" }}>
      Launch hundreds of city SEO pages directly into Shopify.
    </p>
  </div>

  {/* Proof Card 2 */}
  <div
    style={{
      background: "#f8f9fb",
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      fontWeight: 800,
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    }}
  >
    📍 Built for Local Customers  
    <p style={{ marginTop: "6px", fontWeight: 500, fontSize: "14px", color: "#555" }}>
      Each page targets real searches in real cities.
    </p>
  </div>

  {/* Proof Card 3 */}
  <div
    style={{
      background: "#f8f9fb",
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      fontWeight: 800,
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    }}
  >
    🔥 Dashboard Included  
    <p style={{ marginTop: "6px", fontWeight: 500, fontSize: "14px", color: "#555" }}>
      See traffic + leads happening live inside TradePilot.
    </p>
  </div>
</div>

{/* ===========================
    MINI SCREENSHOT PREVIEW (NEW)
=========================== */}
<div style={{ marginTop: "55px" }}>
  <h3
    style={{
      fontSize: "22px",
      fontWeight: 900,
      marginBottom: "18px",
    }}
  >
    Real TradePilot Preview 👇
  </h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px",
      maxWidth: "900px",
      margin: "0 auto",
    }}
  >
    {[
      "/screenshots/IMG_5903.JPEG",
      "/screenshots/IMG_5905.JPEG",
      "/screenshots/IMG_5906.JPEG",
    ].map((src) => (
      <img
        key={src}
        src={src}
        alt="TradePilot Preview"
        onClick={() => setActiveShot(src)}
        style={{
          width: "100%",
          borderRadius: "14px",
          border: "1px solid #eee",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      />
    ))}
  </div>

  <p style={{ marginTop: "14px", fontSize: "13px", color: "#777" }}>
    Tap any image to expand full size.
  </p>
</div>

        </section>

        {/* ===========================
            SHOPIFY SECTION (NEW TARGET)
        =========================== */}
        <section style={{ marginTop: "95px" }}>
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            Perfect for Shopify Website Owners
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "860px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Already have a Shopify store or service website? TradePilot connects
            directly into Shopify and launches hundreds of local SEO landing
            pages that bring customers into your business automatically.
          </p>

          <div
            style={{
              marginTop: "35px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              "Shopify Page Publishing Engine",
              "City + Service Landing Pages",
              "Google Indexing Support",
              "Optional Live Traffic Dashboard",
              "Built for Small Business Budgets",
              "Start With Just 50–100 Pages",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "16px",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                  fontWeight: 700,
                }}
              >
                ✅ {item}
              </div>
            ))}
          </div>
        </section>

        {/* ===========================
            START SMALL SECTION (FUNNEL BOOST)
        =========================== */}
        <section style={{ marginTop: "110px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            Start Small — Scale Anytime
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "850px",
              margin: "0 auto",
              lineHeight: 1.7,
              marginBottom: "45px",
            }}
          >
            TradePilot was built for small businesses that want more customers —
            without spending thousands upfront.
            <br />
            You can start with a small batch of local pages, then grow over time.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "22px",
              maxWidth: "950px",
              margin: "0 auto",
            }}
          >
            {[
              "Start with just 50–100 pages",
              "No long-term contracts required",
              "Perfect for new businesses getting started",
              "Grow into thousands of cities when ready",
              "Optional monthly traffic monitoring",
              "Built for real people, not big corporations",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "white",
                  padding: "26px",
                  borderRadius: "16px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                ✅ {item}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div style={{ textAlign: "center", marginTop: "45px" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "18px 40px",
                borderRadius: "14px",
                background: "black",
                color: "white",
                fontSize: "18px",
                fontWeight: 900,
                border: "none",
                cursor: "pointer",
              }}
            >
              Tell Us What You Need →
            </button>

            <p style={{ marginTop: "12px", fontSize: "14px", color: "#777" }}>
              Whether you want 50 pages or 50,000 — we’ll build the right rollout.
            </p>
          </div>
        </section>

        {/* ===========================
            OWNERSHIP SECTION (HUGE TRUST)
        =========================== */}
        <section style={{ marginTop: "110px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            Once We Build Your Pages… They’re Yours Forever
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "850px",
              margin: "0 auto",
              lineHeight: 1.7,
              marginBottom: "45px",
            }}
          >
            TradePilot is not a locked subscription or rental platform.
            <br />
            After we generate and publish your local SEO pages onto your website,
            those pages belong to your business permanently.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "22px",
              maxWidth: "950px",
              margin: "0 auto",
            }}
          >
            {[
              "One-time rollout options available",
              "Flat build cost based on page volume",
              "Optional monthly monitoring + expansion",
              "Pages stay on your website forever",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "white",
                  padding: "26px",
                  borderRadius: "16px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                  fontSize: "16px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                ✅ {item}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "45px" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "18px 40px",
                borderRadius: "14px",
                background: "#b80d0d",
                color: "white",
                fontSize: "18px",
                fontWeight: 900,
                border: "none",
                cursor: "pointer",
              }}
            >
              Request My Rollout →
            </button>
          </div>
        </section>

        {/* ===========================
            EXAMPLE PAGES PREVIEW (FUNNEL BOOST)
        =========================== */}
        <section style={{ marginTop: "110px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            Example Pages TradePilot Builds
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "850px",
              margin: "0 auto",
              lineHeight: 1.7,
              marginBottom: "55px",
            }}
          >
            These are the exact types of pages we generate for small businesses.
            Each page targets a service + city, designed to rank in Google and
            bring in real local customers.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            {[
              {
                title: "Plumber in Dallas, TX",
                desc: "Local plumbing repair pages built for homeowners searching nearby.",
                example:
                  "“Looking for a plumber in Dallas? Our team provides fast emergency plumbing service…”",
              },
              {
                title: "Mobile Detailer in Miami, FL",
                desc: "Perfect for service businesses that travel to customers.",
                example:
                  "“Book a mobile car detailing service in Miami — we come to you…”",
              },
              {
                title: "Barber Shop in Houston, TX",
                desc: "Great for beauty, personal care, and appointment-based businesses.",
                example:
                  "“Need a haircut in Houston? Visit our local barbershop for fades, tapers…”",
              },
              {
                title: "Solar Installer in Phoenix, AZ",
                desc: "High-ticket home service pages that generate strong inbound leads.",
                example:
                  "“Solar panel installation in Phoenix — free estimates and fast setup…”",
              },
              {
                title: "Lawn Care in Atlanta, GA",
                desc: "Outdoor and recurring service businesses rank extremely well locally.",
                example:
                  "“Trusted lawn mowing and landscaping services in Atlanta…”",
              },
              {
                title: "HVAC Repair in Chicago, IL",
                desc: "Contractor pages built for urgent searches and high conversion calls.",
                example:
                  "“AC not working? Call our Chicago HVAC repair team today…”",
              },
            ].map((page) => (
              <div
                key={page.title}
                style={{
                  background: "white",
                  borderRadius: "18px",
                  padding: "28px",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 900 }}>
                  {page.title}
                </h3>

                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "15px",
                    color: "#555",
                    lineHeight: 1.6,
                  }}
                >
                  {page.desc}
                </p>

                <div
                  style={{
                    marginTop: "16px",
                    background: "#f8f9fb",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    color: "#444",
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  {page.example}
                </div>

                <p
                  style={{
                    marginTop: "14px",
                    fontSize: "13px",
                    color: "#777",
                  }}
                >
                  ✅ Built + published directly to your website
                </p>
              </div>
            ))}
          </div>

          {/* CTA UNDER EXAMPLES */}
          <div style={{ textAlign: "center", marginTop: "55px" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "18px 42px",
                borderRadius: "14px",
                background: "black",
                color: "white",
                fontSize: "18px",
                fontWeight: 900,
                border: "none",
                cursor: "pointer",
              }}
            >
              Build Pages Like This For My Business →
            </button>

            <p style={{ marginTop: "12px", fontSize: "14px", color: "#777" }}>
              Tell us your service + city targets — we’ll handle the rest.
            </p>
          </div>
        </section>

{/* ===========================
    TRADEPILOT SCREENSHOT PREVIEW
=========================== */}
<section style={{ marginTop: "110px" }}>
  <h2
    style={{
      fontSize: "42px",
      fontWeight: 900,
      textAlign: "center",
      marginBottom: "18px",
    }}
  >
    Real TradePilot Screenshots (Live System Preview)
  </h2>

  <p
    style={{
      textAlign: "center",
      fontSize: "18px",
      color: "#555",
      maxWidth: "850px",
      margin: "0 auto",
      lineHeight: 1.7,
      marginBottom: "55px",
    }}
  >
    These are real screenshots from inside TradePilot — showing what business
    owners actually get access to after we build and launch their SEO pages.
  </p>

  {/* ✅ Screenshot Grid */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "22px",
      maxWidth: "1050px",
      margin: "0 auto",
    }}
  >
    {[
      "/screenshots/IMG_5903.JPEG",
      "/screenshots/IMG_5905.JPEG",
      "/screenshots/IMG_5906.JPEG",
      "/screenshots/IMG_5907.JPEG",
      "/screenshots/IMG_5908.JPEG",
      "/screenshots/IMG_5909.JPEG",
    ].map((src) => (
      <div
        key={src}
        style={{
          background: "white",
          borderRadius: "18px",
          padding: "14px",
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <img
  src={src}
  alt="TradePilot Screenshot Preview"
  onClick={() => setActiveShot(src)}
  style={{
    width: "100%",
    height: "auto",
    borderRadius: "14px",
    border: "1px solid #eee",
    cursor: "pointer",
    transition: "0.2s ease",
  }}
/>

      </div>
    ))}
  </div>

  {/* CTA */}
  <div style={{ textAlign: "center", marginTop: "55px" }}>
    <button
      onClick={() => setShowForm(true)}
      style={{
        padding: "18px 42px",
        borderRadius: "14px",
        background: "#b80d0d",
        color: "white",
        fontSize: "18px",
        fontWeight: 900,
        border: "none",
        cursor: "pointer",
      }}
    >
      Get Pages + Dashboard Access →
    </button>

    <p style={{ marginTop: "12px", fontSize: "14px", color: "#777" }}>
      After we publish your pages, they stay on your website forever.
    </p>
  </div>
</section>

        {/* ===========================
            LIVE MAP DEMO SECTION
        =========================== */}
        <section style={{ marginTop: "110px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            Watch Local SEO Traffic Happen in Real Time
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "850px",
              margin: "0 auto",
              lineHeight: 1.7,
              marginBottom: "45px",
            }}
          >
            This is what business owners see inside TradePilot — visitors landing
            on SEO pages across the United States.
          </p>

          <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
            <LiveUSMap
              visitors={[
                {
                  city: "Los Angeles",
                  state: "CA",
                  latitude: 34.0522,
                  longitude: -118.2437,
                  count: 6,
                  page_key: "roofing-company-demo",
                },
                {
                  city: "Dallas",
                  state: "TX",
                  latitude: 32.7767,
                  longitude: -96.797,
                  count: 4,
                  page_key: "hvac-leads-demo",
                },
                {
                  city: "Miami",
                  state: "FL",
                  latitude: 25.7617,
                  longitude: -80.1918,
                  count: 3,
                  page_key: "plumbing-services-demo",
                },
                {
                  city: "Chicago",
                  state: "IL",
                  latitude: 41.8781,
                  longitude: -87.6298,
                  count: 5,
                  page_key: "beauty-business-demo",
                },
                {
                  city: "Denver",
                  state: "CO",
                  latitude: 39.7392,
                  longitude: -104.9903,
                  count: 3,
                  page_key: "concrete-demo",
                },
                {
                  city: "New York",
                  state: "NY",
                  latitude: 40.7128,
                  longitude: -74.006,
                  count: 6,
                  page_key: "contractor-leads-demo",
                },
              ]}
            />
          </div>

          <div style={{ textAlign: "center", marginTop: "35px" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "18px 38px",
                borderRadius: "14px",
                background: "#b80d0d",
                color: "white",
                fontSize: "18px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              Build Pages for My Business →
            </button>

            <p style={{ marginTop: "12px", fontSize: "14px", color: "#777" }}>
              Start small. Scale anytime. Built for people trying to grow.
            </p>
          </div>
        </section>

        {/* ===========================
            WHO THIS IS FOR (EXPANDED)
        =========================== */}
        <section style={{ marginTop: "110px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Built for Everyday Small Businesses
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#555",
              maxWidth: "860px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Whether you're a contractor, barber, nail tech, or service business —
            if customers search for what you do in Google, TradePilot helps you
            show up.
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
              "Barbers & Hair Stylists",
              "Nail Salons & Lash Techs",
              "Massage Therapists & Wellness Clinics",

              "Personal Trainers & Gym Coaches",
              "Fitness Studios & Bootcamps",
              "Martial Arts & Boxing Gyms",
              "Yoga & Pilates Instructors",

              "Plumbers & Electricians",
              "HVAC Companies",
              "Roofers & Remodelers",
              "Concrete & Driveway Contractors",
              "Fence & Gate Installers",

              "Lawn Care & Landscaping Businesses",
              "Tree Cutting & Tree Service",
              "Pressure Washing Services",

              "House Cleaning Services",
              "Laundry & Dry Cleaning Businesses",
              "Car Wash & Mobile Detailing Services",

              "Trash Removal Services",
              "Junk Removal Companies",
              "Moving & Delivery Businesses",

              "Solar Panel Installation Companies",
              "Security System Installers",
              "TV Mounting & Entertainment Installers",
              "Smart Home Setup Services",

              "Robotics & Automation Companies",
              "Commercial Equipment Installers",

              "Any Local Business Expanding Cities",
            ].map((biz) => (
              <div
                key={biz}
                style={{
                  background: "white",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                🔥 {biz}
              </div>
            ))}
          </div>

        </section>

        {/* ===========================
            FAQ CONTENT (SEO BOOST)
        =========================== */}
        <section style={{ marginTop: "120px" }}>
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            Frequently Asked Questions
          </h2>

          {[
            {
              q: "Do I need a big budget?",
              a: "No. TradePilot is designed so small businesses can start with just a small batch of pages and grow over time.",
            },
            {
              q: "What if I only want 100 pages?",
              a: "That’s totally fine. Many businesses start small — we can build exactly what you need.",
            },
            {
              q: "Does this work for Shopify stores?",
              a: "Yes. TradePilot was built on Shopify and connects perfectly for fast publishing and indexing.",
            },
            {
              q: "Do I need to understand SEO?",
              a: "No. We handle the page building, structure, publishing, and indexing support for you.",
            },
          ].map((item) => (
            <div
              key={item.q}
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                marginBottom: "18px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                {item.q}
              </h3>
              <p style={{ marginTop: "8px", color: "#555", lineHeight: 1.6 }}>
                {item.a}
              </p>
            </div>
          ))}
        </section>

       {/* ===========================
    INDEXING + OWNERSHIP DISCLAIMER (SaaS Legal Fine Print)
=========================== */}
<section style={{ marginTop: "90px" }}>
  <div
    style={{
      maxWidth: "980px",
      margin: "0 auto",
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "18px",
      padding: "28px 30px",
      fontSize: "13.5px",
      color: "#666",
      lineHeight: 1.85,
    }}
  >
    <p style={{ margin: 0 }}>
      <strong style={{ color: "#111" }}>
        Important Notice (SEO + Indexing):
      </strong>{" "}
      TradePilot provides automated local SEO page generation and publishing
      services designed to help businesses improve their online visibility.
      <br />
      <br />
      While we follow proven SEO structure and best practices,{" "}
      <strong style={{ color: "#111" }}>
        Google and other search engines independently determine
      </strong>{" "}
      whether pages are indexed, ranked, or shown in search results. Indexing,
      traffic, and lead volume are not guaranteed and may vary based on market
      competition, website authority, content relevance, and algorithm updates.
      <br />
      <br />
      <strong style={{ color: "#111" }}>
        Ownership & Deliverables:
      </strong>{" "}
      Once pages are generated and published onto your website (including Shopify
      or other supported platforms), those pages become part of your site
      permanently. You retain full ownership and control of all published
      content.
      <br />
      <br />
      Optional monitoring, reporting, or ongoing expansion services may be
      offered separately, but continued service is never required for page
      ownership.
    </p>

    {/* Divider */}
    <div
      style={{
        margin: "18px 0",
        height: "1px",
        background: "#e5e7eb",
      }}
    />

    <p style={{ margin: 0, fontSize: "12.5px", color: "#777" }}>
      By requesting TradePilot services, you acknowledge that SEO outcomes are
      influenced by third-party search engines and cannot be fully controlled or
      guaranteed. TradePilot does not provide legal, financial, or marketing
      performance guarantees.
      <br />
      <br />
      <span style={{ fontStyle: "italic" }}>
        Terms apply. Page publishing availability may vary depending on platform
        access and website configuration.
      </span>
    </p>
{/* ✅ Legal Footer Links */}
<p
  style={{
    marginTop: "18px",
    fontSize: "12.5px",
    color: "#777",
    textAlign: "center",
  }}
>
  <a
    href="/privacy"
    style={{
      color: "#444",
      textDecoration: "underline",
      fontWeight: 600,
      marginRight: "10px",
    }}
  >
    Privacy Policy
  </a>

  •

  <a
    href="/terms"
    style={{
      color: "#444",
      textDecoration: "underline",
      fontWeight: 600,
      marginLeft: "10px",
    }}
  >
    Terms of Service
  </a>

  
</p>

    <p
      style={{
        marginTop: "14px",
        fontSize: "12px",
        color: "#888",
        textAlign: "right",
      }}
    >
      TradePilot™ — Updated {new Date().getFullYear()}
    </p>
  </div>
</section>



        {/* FINAL CTA */}
        <section
          style={{
            marginTop: "120px",
            textAlign: "center",
            padding: "80px 35px",
            borderRadius: "22px",
            background: "black",
            color: "white",
          }}
        >
          <h2 style={{ fontSize: "42px", fontWeight: 900 }}>
            Want More Customers From Google?
          </h2>

          <p style={{ fontSize: "18px", marginTop: "15px", opacity: 0.9 }}>
            Tell us what kind of business you have, and how many pages you want.
            We’ll reach out with next steps.
          </p>

          <button
            onClick={() => setShowForm(true)}
            style={{
              marginTop: "28px",
              padding: "18px 38px",
              borderRadius: "12px",
              background: "white",
              color: "black",
              fontSize: "18px",
              fontWeight: 900,
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
          · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>

        </p>

        {showForm && <LeadModal onClose={() => setShowForm(false)} />}

{/* ===========================
    SCREENSHOT EXPAND MODAL
=========================== */}
{activeShot && (
  <div
    onClick={() => setActiveShot(null)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99999,
      padding: "30px",
    }}
  >
    {/* Modal Content */}
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
  position: "relative",
  maxWidth: "720px",
  width: "100%",
  maxHeight: "90vh",
  overflow: "auto",
  borderRadius: "18px",
  boxShadow: "0 15px 50px rgba(0,0,0,0.4)",
}}

    >
      {/* Close Button */}
      <button
        onClick={() => setActiveShot(null)}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "white",
          border: "none",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          fontSize: "18px",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {/* Full Screenshot */}
      <img
        src={activeShot}
        alt="Expanded TradePilot Screenshot"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  </div>
)}


      </div>
    </main>
  );
}

/* ===========================
   MODAL FORM (UNCHANGED)
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

        {Object.entries(form).map(([key, value]) => (
          <input
            key={key}
            placeholder={key.replaceAll("_", " ").toUpperCase()}
            value={value}
            onChange={(e) =>
              setForm({ ...form, [key]: e.target.value })
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
            }}
          />
        ))}

        <button
          onClick={submit}
          style={{
            width: "100%",
            marginTop: "18px",
            padding: "14px",
            borderRadius: "10px",
            background: "black",
            color: "white",
            fontWeight: 900,
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
