

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";

/* ===============================
   TYPES
================================ */
type Partner = {
  id: string;
  partner_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  phone: string | null;
  business_name: string | null;
  coverage_area: string | null;
  preferred_contact: string | null;
  sales_experience: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileItem, setEditProfileItem] = useState<Partner | null>(null);

  const [stats, setStats] = useState({
    totalLeads: 0,
    totalOrders: 0,
    totalCommission: 0,
  });

  const searchParams = useSearchParams();

  /* ===============================
     SEARCH PARAM HANDLER
  =============================== */
  useEffect(() => {
    const open = searchParams.get("editProfile");
    if (open === "1" && partner) {
      setEditProfileItem(partner);
      setEditProfileOpen(true);
    }
  }, [searchParams, partner]);

  /* ===============================
     LOAD PARTNER
  =============================== */
  useEffect(() => {
    async function loadPartner() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("partners")
        .select(`
          id,
          partner_id,
          first_name,
          last_name,
          email_address,
          phone,
          business_name,
          coverage_area,
          preferred_contact,
          sales_experience,
          street,
          city,
          state,
          zip
        `)
        .eq("email_address", user.email)
        .limit(1);

      if (!error && data && data.length > 0) {
        setPartner(data[0]);
      }

      setLoading(false);
    }

    loadPartner();
  }, []);

  /* ===============================
     LOAD DASHBOARD STATS
  =============================== */
  useEffect(() => {
    if (!partner?.partner_id) return;

    async function loadDashboardStats() {
      const { data: rows } = await supabase
        .from("leads")
        .select("submission_type, swing_price, accessory_price, bonus_extra")
        .eq("partner_id", partner!.partner_id);

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
          totalCommission += commission + bonus;
        } else {
          totalLeads += 1;
        }
      });

      setStats({ totalLeads, totalOrders, totalCommission });
    }

    loadDashboardStats();
  }, [partner?.partner_id]);

  /* ===============================
     GUARDS
  =============================== */
  if (loading) return <div className="p-6">Loading…</div>;
  if (!partner) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-red-700">
        Partner record not found
      </h2>
      <p className="mt-2 text-gray-600">
        Logged in email did not match a row in the partners table.
      </p>
    </div>
  );
}


  const swingTrackingLink = `https://doorplaceusa.com/pages/swing-partner-lead?pid=${partner.partner_id}`;

  function copyTrackingLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(swingTrackingLink)
        .then(() => alert("Tracking link copied!"))
        .catch(() => fallbackCopy(swingTrackingLink));
    } else {
      fallbackCopy(swingTrackingLink);
    }
  }

  function fallbackCopy(text: string) {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
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

      {/* STATS */}
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
            <li>Share this link anywhere — Facebook, Instagram, TikTok, text, flyers.</li>
            <li>Leads submitted through this link are tracked to your Partner ID.</li>
            <li>If a swing is purchased, you earn a tracking-link commission.</li>
            <li>Track all activity in your Commission Tracker.</li>
            <li>You’ll receive an email notification when a form is submitted.</li>
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

      {/* EDIT PROFILE MODAL */}
      {editProfileOpen && editProfileItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-6 space-y-3">
            <h2 className="text-xl font-bold">My Profile</h2>

            <input className="border w-full px-3 py-2" placeholder="First Name" value={editProfileItem.first_name || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,first_name:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Last Name" value={editProfileItem.last_name || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,last_name:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Phone" value={editProfileItem.phone || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,phone:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Business Name" value={editProfileItem.business_name || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,business_name:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Coverage Area" value={editProfileItem.coverage_area || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,coverage_area:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Preferred Contact" value={editProfileItem.preferred_contact || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,preferred_contact:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Sales Experience" value={editProfileItem.sales_experience || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,sales_experience:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Street" value={editProfileItem.street || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,street:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="City" value={editProfileItem.city || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,city:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="State" value={editProfileItem.state || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,state:e.target.value})}/>
            <input className="border w-full px-3 py-2" placeholder="Zip" value={editProfileItem.zip || ""} onChange={(e)=>setEditProfileItem({...editProfileItem,zip:e.target.value})}/>

            <div className="flex gap-2 pt-2">
              <button className="bg-red-700 text-white px-4 py-2 rounded flex-1" onClick={async ()=>{
                await supabase.from("partners").update(editProfileItem).eq("id",editProfileItem.id);
                setPartner(editProfileItem);
                setEditProfileOpen(false);
              }}>Save</button>
              <button className="bg-gray-300 px-4 py-2 rounded flex-1" onClick={()=>setEditProfileOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
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

