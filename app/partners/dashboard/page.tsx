"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type Partner = {
  id: string;
  partner_id: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
};

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  // ✅ NEW: dashboard stats (wired to leads table)
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalOrders: 0,
    totalCommission: 0,
  });

  /* ===============================
     LOAD PARTNER
  =============================== */
  async function loadPartner() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("partners")
      .select("id, partner_id, first_name, last_name, email_address")
      .eq("email_address", user.email)
      .single();

    if (data?.partner_id) {
      setPartner(data);
      loadDashboardStats(data.partner_id); // 👈 load real stats
    } else {
      setPartner(null);
    }

    setLoading(false);
  }

  /* ===============================
     LOAD DASHBOARD STATS
     (SAME LOGIC AS COMMISSIONS PAGE)
  =============================== */
  async function loadDashboardStats(pid: string) {
  const { data: rows } = await supabase
    .from("leads")
    .select("submission_type, swing_price, accessory_price, bonus_extra")
    .eq("partner_id", pid);

  if (!rows) return;

  let totalLeads = 0;
  let totalOrders = 0;
  let totalCommission = 0;

  rows.forEach((r: any) => {
    const swing = Number(r.swing_price || 0);
    const accessories = Number(r.accessory_price || 0);
    const bonus = Number(r.bonus_extra || 0);

    const base = swing + accessories;
    const commission = Math.round(base * 0.12 * 100) / 100;

    if (r.submission_type === "partner_order") {
      totalOrders += 1;
      totalCommission += commission + bonus; // ✅ FIX
    } else {
      totalLeads += 1;
    }
  });

  setStats({
    totalLeads,
    totalOrders,
    totalCommission,
  });
}


  useEffect(() => {
    loadPartner();
  }, []);

  /* ===============================
     GUARDS
  =============================== */
  if (loading) return <div className="p-6">Loading…</div>;

  if (!partner) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-700">
          Partner Access Pending
        </h2>
        <p className="mt-2 text-gray-600">
          Your partner account has not been activated yet.
        </p>
      </div>
    );
  }

  const swingTrackingLink = `https://doorplaceusa.com/pages/swing-partner-lead?pid=${partner.partner_id}`;

  function copyTrackingLink() {
  const text = swingTrackingLink;

  // Modern browsers (HTTPS, desktop)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Tracking link copied!");
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const input = document.createElement("input");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  input.setSelectionRange(0, 99999); // iOS fix
  document.execCommand("copy");
  document.body.removeChild(input);
  alert("Tracking link copied!");
}


  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {partner.first_name || "Partner"}
        </h1>
        <p className="text-gray-600 text-sm">
          Partner ID: <span className="font-mono">{partner.partner_id}</span>
        </p>
      </div>

      {/* SUMMARY CARDS — NOW LIVE DATA */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card label="Total Leads" value={stats.totalLeads} />
        <Card label="Total Orders" value={stats.totalOrders} />
        <Card
          label="Total Commission"
          value={stats.totalCommission.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        />
      </div>

      {/* WELCOME VIDEO */}
      <div className="border rounded overflow-hidden">
        <button
          onClick={() => setShowVideo(!showVideo)}
          className="w-full flex justify-between items-center bg-red-700 text-white px-4 py-3 font-bold"
        >
          <span>Welcome Video</span>
          <span className="text-xl">{showVideo ? "−" : "+"}</span>
        </button>

        {showVideo && (
          <div className="p-4 bg-white space-y-4">
            <div className="aspect-video bg-black rounded overflow-hidden">
  <video
    src="https://cdn.shopify.com/videos/c/o/v/3cb96a79231f4f72891a5d6d4b279c7b.mp4"
    controls
    playsInline
    preload="metadata"
    className="w-full h-full object-contain"
  />
</div>


            <p className="text-sm text-gray-600">
              This video explains how to earn commissions, how to use your
              tracking link, and which partner path is best for you.
            </p>
          </div>
        )}
      </div>

      {/* TRACKING LINK */}
      <div className="border rounded overflow-hidden">
        <div className="bg-red-700 text-white px-4 py-3 font-bold">
          Your Swing Tracking Link
        </div>

        <div className="p-4 space-y-4">
          <input
            readOnly
            value={swingTrackingLink}
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button
            onClick={copyTrackingLink}
            className="w-full bg-black text-white py-3 rounded font-bold"
          >
            Copy Link
          </button>

          <div className="bg-gray-100 p-3 rounded text-sm text-red-700 font-semibold text-center">
            Earn $100 commission + $50 bonus for every lead that becomes an order
          </div>

          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>
              Share this link anywhere — Facebook, Instagram, TikTok, text,
              flyers.
            </li>
            <li>
              Leads submitted through this link are tracked to your Partner ID.
            </li>
            <li>
              If a swing is purchased, you earn a tracking-link commission.
            </li>
            <li>
              Track all activity in your Commission Tracker.
            </li>
            <li>
              You’ll receive an email notification when a form is submitted.
            </li>
          </ul>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
        <ActionButton href="/partners/orders/new" label="Submit Swing Order" />
        <ActionButton href="/partners/commissions" label="Commissions" />
        <ActionButton href="/partners/resources" label="Swing Resources" />
        <ActionButton href="/partners/orders" label="My Orders" />
        <ActionButton href="/partners/leads" label="My Leads" />
        <ActionButton href="/partners/help" label="Help & Docs" />
      </div>
    </div>
  );
}

/* ===============================
   UI COMPONENTS
================================ */
function Card({ label, value }: any) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function ActionButton({ href, label }: any) {
  return (
    <a
      href={href}
      className="block text-center bg-red-700 text-white py-3 rounded font-bold"
    >
      {label}
    </a>
  );
}
