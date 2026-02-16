"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import PartnerMessages from "./components/PartnerMessages";
import PartnerSocialShareCard from "./components/PartnerSocialShareCard";
import PartnerQRCode from "@/app/partners/dashboard/components/PartnerQRCode";






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
  const [showVideo, setShowVideo] = useState(true);
  const router = useRouter();
  const [linkViews, setLinkViews] = useState<number>(0);
  const [showPayouts, setShowPayouts] = useState(false);










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
const [showMessages, setShowMessages] = useState(false);


  const [stats, setStats] = useState({
  totalLeads: 0,
  totalOrders: 0,
  totalCommission: 0,
});


  const [loadError, setLoadError] = useState<string | null>(null);



  useEffect(() => {
  function openProfile() {
    setEditProfileItem(partner);
    setEditProfileOpen(true);
  }

  window.addEventListener("open-profile", openProfile);
  return () => window.removeEventListener("open-profile", openProfile);
}, [partner?.partner_id]);


useEffect(() => {
  const onFocus = () => {
    window.location.reload();
  };

  window.addEventListener("focus", onFocus);

  return () => {
    window.removeEventListener("focus", onFocus);
  };
}, []);



  /* ===============================
     LOAD PARTNER  ✅ (THIS IS THE WORKING PART)
  =============================== */
  useEffect(() => {

    
    async function loadPartner() {
      setLoading(true);
      setLoadError(null);

      const { data: authData, error: userErr } = await supabase.auth.getUser();

const user = authData?.user ?? null;

if (!user) {
  router.push("/login");
  return;
}


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

    setStats({
  totalLeads,
  totalOrders,
  totalCommission,
 
});

  }

  loadDashboardStats();
}, [partner]);

useEffect(() => {
  const partnerId = partner?.partner_id;
  if (!partnerId) return;

  async function loadLinkViews() {
    // ✅ Last 30 days only
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { count, error } = await supabase
      .from("page_view_events")
      .select("*", { count: "exact", head: true })

      // ✅ Only this partner
      .eq("partner_id", partnerId)

      // ✅ Only real humans
      .eq("source", "human")

      // ✅ Only tracking page clicks
      .ilike("page_url", "%swing-partner-lead%")

      // ✅ Only last 30 days
      .gte("created_at", since.toISOString());

    if (!error && typeof count === "number") {
      setLinkViews(count);
    }
  }

  loadLinkViews();
}, [partner?.partner_id]);







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
    <div className="fixed inset-0 z-9999 bg-black/60 flex items-center justify-center p-4">

      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[70vh] flex flex-col shadow-xl">

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
                ? "bg-red-700 cursor-not-allowed"
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
  // ✅ IMPORTANT: update LOCAL partner state
  setPartner((prev) =>
    prev
      ? {
          ...prev,
          agreed_to_partner_terms: true,
          agreed_to_partner_terms_at: new Date().toISOString(),
        }
      : prev
  );

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
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

  {/* LINK VIEWS */}
  <div className="bg-white border rounded-xl p-5 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-400">
      Tracking Link Views
    </div>
    <div className="mt-1 text-2xl font-bold text-gray-900">
      {linkViews}
    </div>
  </div>

  {/* TOTAL LEADS */}
  <div className="bg-white border rounded-xl p-5 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-400">
      Total Leads
    </div>
    <div className="mt-1 text-2xl font-bold text-gray-900">
      {stats.totalLeads}
    </div>
  </div>

  {/* TOTAL ORDERS */}
  <div className="bg-white border rounded-xl p-5 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-400">
      Total Orders
    </div>
    <div className="mt-1 text-2xl font-bold text-gray-900">
      {stats.totalOrders}
    </div>
  </div>

  {/* TOTAL COMMISSION */}
  <div className="bg-white border rounded-xl p-5 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-400">
      Total Commission
    </div>
    <div className="mt-1 text-2xl font-bold text-gray-900">
      {stats.totalCommission.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })}
    </div>
  </div>

</div>






      {/* WELCOME VIDEO */}
<div className="bg-white border rounded-xl shadow-sm overflow-hidden">

  {/* HEADER */}
  <button
    onClick={() => setShowVideo(!showVideo)}
    className="w-full flex items-center justify-between px-5 py-4 text-left"
  >
    <div>
      <div className="text-sm text-gray-500 font-medium">
        Step 1
      </div>
      <div className="text-lg font-bold text-gray-900">
        Watch Welcome Video
      </div>
    </div>

    <div className="text-2xl text-gray-400">
      {showVideo ? "−" : "+"}
    </div>
  </button>

  {/* CONTENT */}
  {showVideo && (
    <div className="px-5 pb-5 space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src="https://cdn.shopify.com/videos/c/o/v/aab639df1f4b4ce0937e18ae88b5e3b0.mp4"
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
        />
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        This video explains how to earn commissions, how to use your tracking link, and which partner
        path is best for you.
      </p>
    </div>
  )}
</div>


<PartnerSocialShareCard partnerId={partner.partner_id!} />
<PartnerQRCode trackingLink={swingTrackingLink} />


      {/* FUTURE DOOR TRACKING LEADS */}
<div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">

  <div>
    <div className="text-sm text-gray-500 font-medium">
      Coming Soon
    </div>
    <div className="text-lg font-bold text-gray-900">
      Door Tracking Leads
    </div>
  </div>

  <p className="text-sm text-gray-700 leading-relaxed">
    We’re actively building a door tracking system similar to your swing
    tracking link. Once released, you’ll be able to share select Doorplace USA
    door pages and earn commissions when those leads turn into completed door
    projects.
  </p>

  <p className="text-sm text-gray-600 leading-relaxed">
    This will include interior doors, exterior doors, custom designs, and
    specialty projects — all tracked back to your Partner ID automatically.
  </p>

  <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-600 font-medium text-center">
    Door tracking links are not active yet. This feature will unlock in a
    future update.
  </div>

</div>



     {/* PAYOUTS / DIRECT DEPOSIT */}
<div className="bg-white border rounded-xl shadow-sm overflow-hidden">

  {/* HEADER */}
  <button
    onClick={() => setShowPayouts(!showPayouts)}
    className="w-full flex items-center justify-between px-5 py-4 text-left"
  >
    <div>
      <div className="text-sm text-gray-500 font-medium">
        Payouts
      </div>
      <div className="text-lg font-bold text-gray-900">
        Direct Deposit
      </div>
    </div>

    <div className="text-2xl text-gray-400">
      {showPayouts ? "−" : "+"}
    </div>
  </button>

  {/* CONTENT */}
  {showPayouts && (
    <div className="px-5 pb-5 space-y-4">

      {!stats.totalOrders ? (
        <>
          <div className="text-sm font-semibold text-gray-800">
            Direct Deposit: Not Available Yet
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Direct deposit becomes available after your first completed sale.
            Payouts are processed securely through <b>Melio</b>.
          </p>

          <button
            disabled
            className="w-full py-3 rounded-lg font-semibold bg-gray-300 text-gray-600 cursor-not-allowed"
          >
            Set Up Direct Deposit (Available after first sale)
          </button>
        </>
      ) : (
        <>
          <div className="text-sm font-semibold text-gray-800">
            Direct Deposit: Setup Required
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            When your first payout is ready, you’ll receive a secure email from
            <b> Melio</b> with instructions to set up your direct deposit.
          </p>

          <button
            className="w-full py-3 rounded-lg font-semibold bg-black text-white"
            onClick={() =>
              alert(
                "Direct deposit setup is sent when your first payout is issued."
              )
            }
          >
            Set Up Direct Deposit
          </button>
        </>
      )}

    </div>
  )}
</div>




 {/* PRIMARY ACTIONS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  {/* SUBMIT ORDER */}
  <a
    href="/partners/orders/new"
    className="block bg-black text-white rounded-xl px-6 py-5 text-center shadow-sm hover:opacity-90 transition"
  >
    <div className="text-sm text-gray-300 font-medium">
      Primary Action
    </div>
    <div className="text-xl font-bold">
      Submit Swing Order
    </div>
  </a>

  {/* RESOURCES */}
  <a
    href="/partners/resources"
    className="block bg-white border rounded-xl px-6 py-5 text-center shadow-sm hover:bg-gray-50 transition"
  >
    <div className="text-sm text-gray-500 font-medium">
      Tools & Training
    </div>
    <div className="text-xl font-bold text-gray-900">
      Partner Resources
    </div>
  </a>

</div>


      

      
{/* PARTNER UPLOADS */}
<div className="bg-white border rounded-xl shadow-sm overflow-hidden">

  {/* HEADER */}
  <button
    onClick={() => setShowUploads(!showUploads)}
    className="w-full flex items-center justify-between px-5 py-4 text-left"
  >
    <div>
      <div className="text-sm text-gray-500 font-medium">
        Files
      </div>
      <div className="text-lg font-bold text-gray-900">
        Upload Documents & Media
      </div>
    </div>

    <div className="text-2xl text-gray-400">
      {showUploads ? "−" : "+"}
    </div>
  </button>

  {/* CONTENT */}
  {showUploads && (
    <div className="px-5 pb-5 space-y-4">

      {/* FILE INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select a file to upload
        </label>

        <input
          type="file"
          className="block w-full text-sm border rounded-lg px-3 py-2"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setSelectedFile(file);
            setUploadMessage(null);
          }}
        />
      </div>

      {/* SELECTED FILE */}
      {selectedFile && (
        <p className="text-sm text-gray-600">
          Selected file: <b>{selectedFile.name}</b>
        </p>
      )}

      {/* SUBMIT BUTTON */}
      <button
        onClick={handlePartnerUpload}
        disabled={!selectedFile || uploading}
        className={`w-full py-3 rounded-lg font-semibold text-white ${
          !selectedFile || uploading
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-black hover:opacity-90"
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
      <p className="text-xs text-gray-500 leading-relaxed">
        Upload swing photos, door photos, customer videos, installation photos,
        signed documents, or any supporting files requested by Doorplace USA.
      </p>

    </div>
  )}
</div>



      
      
  
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

function ActionButton({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`block text-center py-3 rounded font-bold ${className}`}
    >
      {label}
    </a>
  );
}

