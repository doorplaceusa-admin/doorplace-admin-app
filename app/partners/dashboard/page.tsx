"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";



/* ===============================
   TYPES
================================ */
type Partner = {
  id: string;
  auth_user_id: string | null;
  partner_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  phone: string | null;
  business_name: string | null;
  coverage_area: string | null;
  preferred_contact_method: string | null;
  sales_experience: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;

  // ✅ NEW
  agreed_to_partner_terms: boolean;
  agreed_to_partner_terms_at: string | null;
};


export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const router = useRouter();


  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileItem, setEditProfileItem] = useState<Partner | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [showLegalGate, setShowLegalGate] = useState(false);
const [agreeChecked, setAgreeChecked] = useState(false);
const [agreeSaving, setAgreeSaving] = useState(false);
const [uploading, setUploading] = useState(false);
const [uploadMessage, setUploadMessage] = useState<string | null>(null);
const [showUploads, setShowUploads] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);





  const [stats, setStats] = useState({
    totalLeads: 0,
    totalOrders: 0,
    totalCommission: 0,
  });

  const [loadError, setLoadError] = useState<string | null>(null);

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
     LOAD PARTNER  ✅ (THIS IS THE WORKING PART)
  =============================== */
  useEffect(() => {
    async function loadPartner() {
      setLoading(true);
      setLoadError(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) {
        setLoadError(userErr.message);
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setLoadError("No authenticated user found.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
  .from("partners")
  .select(`
    id,
    auth_user_id,
    partner_id,
    first_name,
    last_name,
    email_address,
    phone,
    business_name,
    coverage_area,
    preferred_contact_method,
    sales_experience,
    street_address,
    city,
    state,
    zip,
    agreed_to_partner_terms,
    agreed_to_partner_terms_at
  `)
  .eq("auth_user_id", user.id)
  .single();


      if (error) {
        setPartner(null);
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      setPartner(data);
      setLoading(false);
    }

    loadPartner();
  }, []);

  useEffect(() => {
  if (partner && !partner.agreed_to_partner_terms) {
    setShowLegalGate(true);
  }
}, [partner]);

async function handlePartnerUpload() {
  if (!partner?.partner_id || !selectedFile) {
    setUploadMessage("Please select a file before submitting.");
    return;
  }

  setUploading(true);
  setUploadMessage(null);

  const file = selectedFile;
  const ext = file.name.split(".").pop();
  const filePath = `${partner.partner_id}/uploads/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("partner-uploads")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    setUploadMessage("Upload failed. Please try again.");
  } else {
    setUploadMessage("File uploaded successfully.");
    setSelectedFile(null);
  }

  setUploading(false);
}



  /* ===============================
     LOAD DASHBOARD STATS ✅ (NO "partner possibly null")
  =============================== */
  useEffect(() => {
  if (!partner?.partner_id) return;

  const partnerId = partner.partner_id;

  async function loadDashboardStats() {
    const { data: rows, error } = await supabase
      .from("leads")
      .select("submission_type, swing_price, accessory_price, bonus_extra")
      .eq("partner_id", partnerId);

    if (error || !rows) return;

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
        totalOrders++;
        totalCommission += commission + bonus;
      } else {
        totalLeads++;
      }
    });

    setStats({ totalLeads, totalOrders, totalCommission });
  }

  loadDashboardStats();
}, [partner]);


  /* ===============================
     GUARDS
  =============================== */
  if (loading) return <div className="p-6">Loading…</div>;

  if (!partner) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-700">Partner record not found</h2>
        <p className="mt-2 text-gray-600">
          This logged-in user does not have a matching row in <b>partners</b> by <b>auth_user_id</b>.
        </p>
        {loadError && (
          <p className="mt-3 text-sm text-gray-500">
            Debug: <span className="font-mono">{loadError}</span>
          </p>
        )}
      </div>
    );
  }

  const swingTrackingLink = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partner.partner_id ?? ""}`;

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

if (showLegalGate && partner) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl">

        {/* HEADER */}
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">
            Legal, Privacy & Partner Terms
          </h2>
          <p className="text-sm text-gray-600">
            You must agree before accessing your partner dashboard.
          </p>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5">
          <iframe
            src="/legal/partner-terms"
            className="w-full h-[60vh] border rounded"
          />
        </div>

        {/* FOOTER */}
        <div className="border-t p-5 space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={agreeChecked}
              onChange={(e) => setAgreeChecked(e.target.checked)}
            />
            I agree to the Legal, Privacy & Partner Terms
          </label>

          <button
            disabled={!agreeChecked || agreeSaving}
            className={`w-full py-3 rounded font-bold text-white ${
              !agreeChecked || agreeSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-700"
            }`}
            onClick={async () => {
              if (!partner || agreeSaving) return;

              setAgreeSaving(true);

              const { error } = await supabase
                .from("partners")
                .update({
                  agreed_to_partner_terms: true,
                  agreed_to_partner_terms_at: new Date().toISOString(),
                })
                .eq("id", partner.id);

              if (!error) {
                setShowLegalGate(false);
              } else {
                alert("Failed to save agreement. Please try again.");
              }

              setAgreeSaving(false);
            }}
          >
            {agreeSaving ? "Saving…" : "Accept & Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}


  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {partner.first_name || "Partner"}</h1>
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
              This video explains how to earn commissions, how to use your tracking link, and which partner
              path is best for you.
            </p>
          </div>
        )}
      </div>

      {/* TRACKING LINK */}
      <div className="border rounded overflow-hidden">
        <div className="bg-red-700 text-white px-4 py-3 font-bold">Your Swing Tracking Link</div>

        <div className="p-4 space-y-4">
          <input readOnly value={swingTrackingLink} className="w-full border rounded px-3 py-2 text-sm" />

          <button onClick={copyTrackingLink} className="w-full bg-black text-white py-3 rounded font-bold">
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
        
      </div>

      
{/* PARTNER UPLOADS */}
<div className="border rounded overflow-hidden">
  <button
    onClick={() => setShowUploads(!showUploads)}
    className="w-full flex justify-between items-center bg-red-700 text-white px-4 py-3 font-bold"
  >
    <span>Upload Files</span>
    <span className="text-xl">{showUploads ? "−" : "+"}</span>
  </button>

  {showUploads && (
    <div className="p-4 space-y-4 bg-white">

      {/* FILE INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select a file to upload
        </label>

        <input
          type="file"
          className="block w-full text-sm border rounded px-3 py-2"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setSelectedFile(file);
            setUploadMessage(null);
          }}
        />
      </div>

      {/* SELECTED FILE NAME */}
      {selectedFile && (
        <p className="text-sm text-gray-600">
          Selected file: <b>{selectedFile.name}</b>
        </p>
      )}

      {/* SUBMIT BUTTON */}
      <button
        onClick={handlePartnerUpload}
        disabled={!selectedFile || uploading}
        className={`w-full py-3 rounded font-bold text-white ${
          !selectedFile || uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black"
        }`}
      >
        {uploading ? "Uploading…" : "Submit Upload"}
      </button>

      {/* MESSAGE */}
      {uploadMessage && (
        <p className="text-sm font-semibold text-green-700">
          {uploadMessage}
        </p>
      )}

      {/* DESCRIPTION */}
      <div className="text-xs text-gray-500 leading-relaxed">
        Upload swing photos, door photos, customer videos, installation photos,
        signed documents, or any supporting files requested by Doorplace USA.
      </div>

    </div>
  )}
</div>


      {/* EDIT PROFILE MODAL */}
      {editProfileOpen && editProfileItem && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded max-w-2xl w-full max-h-[75vh] flex flex-col shadow-lg">

      {/* ================= HEADER (STICKY) ================= */}
      <div className="sticky top-0 bg-white z-10 border-b p-5">
        <h2 className="text-xl font-bold">My Profile</h2>
        <p className="text-sm text-gray-500">
          Partner ID:{" "}
          <span className="font-mono">{editProfileItem.partner_id}</span>
        </p>
      </div>

      {/* ================= SCROLLABLE CONTENT ================= */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* BASIC INFO */}
        <section>
          <h3 className="font-semibold text-sm mb-3 text-gray-700">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="First Name"
              value={editProfileItem.first_name}
              onChange={(v) =>
                setEditProfileItem({ ...editProfileItem, first_name: v })
              }
            />
            <Field
              label="Last Name"
              value={editProfileItem.last_name}
              onChange={(v) =>
                setEditProfileItem({ ...editProfileItem, last_name: v })
              }
            />
          </div>

          <Field
            label="Email Address"
            value={editProfileItem.email_address}
            disabled
          />

          <Field
            label="Phone Number"
            value={editProfileItem.phone}
            onChange={(v) =>
              setEditProfileItem({ ...editProfileItem, phone: v })
            }
          />
        </section>

        {/* BUSINESS INFO */}
        <section>
          <h3 className="font-semibold text-sm mb-3 text-gray-700">
            Business Information
          </h3>

          <Field
            label="Business Name"
            value={editProfileItem.business_name}
            onChange={(v) =>
              setEditProfileItem({ ...editProfileItem, business_name: v })
            }
          />

          <Field
            label="Coverage Area"
            value={editProfileItem.coverage_area}
            onChange={(v) =>
              setEditProfileItem({ ...editProfileItem, coverage_area: v })
            }
          />

          <Field
            label="Preferred Contact Method"
            value={editProfileItem.preferred_contact_method}
            onChange={(v) =>
              setEditProfileItem({
                ...editProfileItem,
                preferred_contact_method: v,
              })
            }
          />

          <Field
            label="Sales Experience"
            value={editProfileItem.sales_experience}
            onChange={(v) =>
              setEditProfileItem({
                ...editProfileItem,
                sales_experience: v,
              })
            }
          />
        </section>

        {/* ADDRESS */}
        <section>
          <h3 className="font-semibold text-sm mb-3 text-gray-700">
            Address
          </h3>

          <Field
            label="Street Address"
            value={editProfileItem.street_address}
            onChange={(v) =>
              setEditProfileItem({ ...editProfileItem, street_address: v })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field
              label="City"
              value={editProfileItem.city}
              onChange={(v) =>
                setEditProfileItem({ ...editProfileItem, city: v })
              }
            />
            <Field
              label="State"
              value={editProfileItem.state}
              onChange={(v) =>
                setEditProfileItem({ ...editProfileItem, state: v })
              }
            />
            <Field
              label="Zip Code"
              value={editProfileItem.zip}
              onChange={(v) =>
                setEditProfileItem({ ...editProfileItem, zip: v })
              }
            />
          </div>
        </section>
      </div>

      {/* ================= FOOTER (STICKY) ================= */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
        <button
  disabled={savingProfile}
  className={`bg-red-700 text-white px-4 py-2 rounded flex-1 ${
    savingProfile ? "opacity-60 cursor-not-allowed" : ""
  }`}
  onClick={async () => {
    if (!editProfileItem || !partner || savingProfile) return;

    setSavingProfile(true);

    const payload = {
      first_name: editProfileItem.first_name,
      last_name: editProfileItem.last_name,
      phone: editProfileItem.phone,
      business_name: editProfileItem.business_name,
      coverage_area: editProfileItem.coverage_area,
      preferred_contact_method: editProfileItem.preferred_contact_method,
      sales_experience: editProfileItem.sales_experience,
      street_address: editProfileItem.street_address,
      city: editProfileItem.city,
      state: editProfileItem.state,
      zip: editProfileItem.zip,
    };

    const { error } = await supabase
      .from("partners")
      .update(payload)
      .eq("id", editProfileItem.id);

    if (error) {
      alert("Save failed. Please try again.");
      setSavingProfile(false);
      return;
    }

    // ✅ Update local state FIRST
    setPartner((prev) => (prev ? { ...prev, ...payload } : prev));

    // ✅ Close modal FIRST
    setEditProfileOpen(false);

    // ✅ THEN clean the URL (no race condition)
    router.replace("/partners/dashboard", { scroll: false });

    // reset flag
    setSavingProfile(false);
  }}
>
  {savingProfile ? "Saving…" : "Save & Close"}
</button>


        <button
          className="bg-gray-300 px-4 py-2 rounded flex-1"
          onClick={() => setEditProfileOpen(false)}
        >
          Cancel

              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value?: string | null;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        className={`border w-full px-3 py-2 rounded ${
          disabled ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""
        }`}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}


function UploadRow({
  label,
  accept,
  onSelect,
}: {
  label: string;
  accept: string;
  onSelect: (file: File) => void;
}) {
  return (
    <label className="block">
      <span className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type="file"
        accept={accept}
        className="block w-full text-sm border rounded px-3 py-2"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
    </label>
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
    <a href={href} className="block text-center bg-red-700 text-white py-3 rounded font-bold">
      {label}
    </a>
  );
}
