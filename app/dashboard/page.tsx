"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminPresence } from "@/app/components/presence/AdminPresenceContext";
import LiveUSMap from "@/app/components/LiveUSMap";




const brandRed = "#b80d0d";

// ================= TYPES =================
type DashboardStats = {
  totalLeads: number;
  totalOrders: number;
  totalRevenue: number;
  pendingCommissions: number;
  paidCommissions: number;
  activePartners: number;
  conversionRate: number;
  totalAppViews: number;
  
  totalSiteViews: number;
  partnerTrackingViews: number;

};


type RecentItem = {
  id: string;
  label: string;
  date: string;
  amount?: number;
};

// ================= PAGE =================
export default function DashboardPage() {
  const [tasksOpen, setTasksOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
  totalLeads: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingCommissions: 0,
  paidCommissions: 0,
  activePartners: 0,
  conversionRate: 0,
  totalAppViews: 0,
 
  totalSiteViews: 0,
  partnerTrackingViews: 0,
});

  const [partnerSnapshot, setPartnerSnapshot] = useState({
  total: 0,
  activated: 0,
  pending: 0,
  active: 0,
});

   const { partners, admins, others } = useAdminPresence();

const totalOnline = partners + admins + others;




  const [recentLeads, setRecentLeads] = useState<RecentItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentItem[]>([]);
  /* ✅ LIVE MAP VISITORS */
const [liveVisitors, setLiveVisitors] = useState<any[]>([]);

  const [partnerPerformance, setPartnerPerformance] = useState<
    { partner_id: string; revenue: number; orders: number }[]
  >([]);

  const [sessionEmail, setSessionEmail] = useState<string>("");

 async function loadLiveMap() {
  const { data, error } = await supabase
    .from("live_map_visitors") // ✅ SAME AS ANALYTICS PAGE
    .select("city,state,count,latitude,longitude,page_url,page_key");


  if (error) {
    console.error("LIVE MAP ERROR:", error);
    return;
  }

  if (data) {
    setLiveVisitors(data);
  }
}


  useEffect(() => {
    async function load() {

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) return;

       const { data: profile, error } = await supabase
         .from("profiles")
           .select("active_company_id, role")
           .eq("id", userId)
           .single();







              if (error || !profile?.active_company_id) {
              console.error("NO COMPANY ID", error, profile);

 


                setLoading(false);
                 return;
                      }


                      const companyId = profile.active_company_id;
            await loadLiveMap();

             
const role = profile.role;


      const { data } = await supabase.auth.getSession();
      setSessionEmail(data.session?.user.email || "");

      // ================= PARTNER FUNNEL SNAPSHOT =================
const { count: totalPartnersCount } = await supabase
  .from("partners")
  .select("*", { count: "exact", head: true });

const { count: activatedPartnersCount } = await supabase
  .from("partners")
  .select("*", { count: "exact", head: true })
  .not("auth_user_id", "is", null);

const { count: pendingPartners } = await supabase
  .from("partners")
  .select("*", { count: "exact", head: true })
  .eq("status", "pending");

const { count: activePartners } = await supabase
  .from("partners")
  .select("*", { count: "exact", head: true })
  .eq("status", "active");

  // ================= PARTNER TRACKING LINK VIEWS "GLOBAL" =================
const { count: partnerTrackingViews } = await supabase
  .from("page_view_events")
  .select("*", { count: "exact", head: true })
  .not("partner_id", "is", null)
  .or(`company_id.eq.${companyId},company_id.is.null`);




  // ================= TOTAL SITE VIEWS (DOORPLACE USA) =================
const { count: totalSiteViews } = await supabase
  .from("page_view_events")
  .select("*", { count: "exact", head: true })
  .or(`company_id.eq.${companyId},company_id.is.null`);



  




setStats((prev) => ({
  ...prev,
  activePartners: activatedPartnersCount || 0,
}));

// local state for snapshot
setPartnerSnapshot({
  total: totalPartnersCount || 0,
  activated: activatedPartnersCount || 0,
  pending: pendingPartners || 0,
  active: activePartners || 0,
});


      // ================= TOTAL LEADS (WIRE THIS) =================
      // Assumes your leads table is named "leads"
      const { count: leadCount } = await supabase
  .from("leads")
  .select("*", { count: "exact", head: true })
  .eq("company_id", companyId)
  .neq("submission_type", "partner_order");



        // ================= TOTAL ORDERS (WIRED HERE) =================
const { count: orderCount } = await supabase
  .from("leads")
  .select("*", { count: "exact", head: true })
  .eq("company_id", companyId)
  .eq("submission_type", "partner_order");




      // ================= RECENT LEADS (WIRE THIS) =================
      // Tries common column names; adjust if your table uses different field names
      const { data: leadsData } = await supabase
  .from("leads")
  .select(`
  lead_id,
  created_at,
  customer_first_name,
  customer_last_name,
  email,
  phone,
  product_type,
  swing_size,
  city,
  state
`)

  .eq("company_id", companyId)
  .order("created_at", { ascending: false })
  .limit(3);



      const mappedRecentLeads: RecentItem[] = (leadsData || []).map((l: any) => {
  const who =
    l.customer_name || l.full_name || l.name || "Lead";
  const what =
    l.interest_type || l.product_interest || "Request";
  const date =
    l.created_at
      ? new Date(l.created_at).toISOString().split("T")[0]
      : "";

  return {
    id: String(l.lead_id),   // ✅ correct
    label: `${who} – ${what}`,
    date,
  };
});


      // ================= APP VIEW STATS (CDStats) =================

// Total App Views
const { count: totalAppViews } = await supabase
  .from("app_view_logs")
  .select("*", { count: "exact", head: true })
  .or(`company_id.eq.${companyId},company_id.is.null`);





      // ✅ Keep your existing placeholders for now where you haven’t wired yet
      setStats({
  totalLeads: leadCount || 0,
  totalOrders: orderCount || 0,
  totalRevenue: 0,
  pendingCommissions: 0,
  paidCommissions: 0,
  activePartners: activatedPartnersCount || 0,
  conversionRate: 0,
  totalAppViews: totalAppViews || 0,
 
  totalSiteViews: totalSiteViews || 0,
  partnerTrackingViews: partnerTrackingViews || 0,
});


      setRecentLeads(mappedRecentLeads);

      // (kept as-is, per your request)
      setRecentOrders([
        { id: "1", label: "Twin Swing – Dallas", date: "2025-12-07", amount: 1895 },
        { id: "2", label: "Crib Swing – Houston", date: "2025-12-06", amount: 1295 },
        { id: "3", label: "Glass Door – Plano", date: "2025-12-05", amount: 3250 },
      ]);

      setPartnerPerformance([
        { partner_id: "DP-101", revenue: 12400, orders: 9 },
        { partner_id: "DP-203", revenue: 9800, orders: 6 },
        { partner_id: "DP-122", revenue: 7400, orders: 5 },
        { partner_id: "DP-311", revenue: 6210, orders: 4 },
      ]);

      setLoading(false);
    }
    load();

// ✅ Refresh live map every 30 seconds (Disk I/O safe)
const interval = setInterval(() => {
  loadLiveMap();
}, 30000);


return () => clearInterval(interval);


  }, []);

  if (loading) return <div>Loading...</div>;

  const isAdmin =
    sessionEmail === "admin@doorplaceusa.com" ||
    sessionEmail === "thomas@doorplaceusa.com";

  return (
  <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-[1500px] w-full mx-auto">
    <div className="px-4 md:px-6 space-y-4">

        <h1 className="text-3xl font-bold" style={{ color: brandRed }}>
          TradePilot
        </h1>

        <div className="text-sm font-medium" style={{ color: brandRed }}>
          Powered by Doorplace USA
        </div>

      </div>

      {/* =================== LIVE VISITOR MAP =================== */}
<div className="bg-white p-4 rounded shadow mb-6">
  <h2 className="text-lg font-semibold mb-3" style={{ color: brandRed }}>
   
  </h2>

  <LiveUSMap visitors={liveVisitors || []} />
</div>

      {/* =================== SUMMARY CARDS =================== */}
      <div style={gridThree}>

  <div
    onClick={() => (window.location.href = "/dashboard/leads")}
    style={{ cursor: "pointer" }}
  >
    <StatCard title="Total Leads" value={stats.totalLeads} />
  </div>

  <div
    onClick={() => (window.location.href = "/dashboard/orders")}
    style={{ cursor: "pointer" }}
  >
    <StatCard title="Total Orders" value={stats.totalOrders} />
  </div>

  <StatCard title="Doorplace Site Views" value={stats.totalSiteViews} />

  <StatCard title="Total App Views" value={stats.totalAppViews} />


  <StatCard title="Partner Tracking Link Views" value={stats.partnerTrackingViews} />


  <StatCard title="Online" value={totalOnline} />

</div>

       {/* =================== PARTNER FUNNEL SNAPSHOT =================== */}
<div className="bg-white p-4 rounded shadow mb-6">
  <h2 className="text-lg font-semibold mb-2" style={{ color: brandRed }}>
    Partner Funnel Snapshot
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    <div>
      <div className="text-gray-500">Total Partners</div>
      <div className="text-xl font-bold">{partnerSnapshot.total}</div>
    </div>

    <div>
      <div className="text-gray-500">UserPass</div>
      <div className="text-xl font-bold text-green-700">
        {partnerSnapshot.activated}
      </div>
    </div>


    <div>
      <div className="text-gray-500">Active Partners</div>
      <div className="text-xl font-bold text-green-700">
        {partnerSnapshot.active}
      </div>
    </div>
  </div>
</div>


{/* 🟡 TASKS REQUIRING ATTENTION */}
<div className="bg-white rounded shadow mb-6 overflow-hidden">

  {/* HEADER (CLICK TO TOGGLE) */}
  <button
    onClick={() => setTasksOpen(!tasksOpen)}
    className="w-full flex items-center justify-between px-4 py-3 text-left border-b"
  >
    <h2 className="text-lg font-semibold" style={{ color: "#b80d0d" }}>
      Tasks Requiring Attention
    </h2>

    <span className="text-sm text-gray-500">
      {tasksOpen ? "Hide" : "Show"}
    </span>
  </button>

  {/* CONTENT */}
  {tasksOpen && (
    <div className="px-4 py-4">
      <ul className="space-y-2">
        <li className="flex justify-between border-b pb-1">
          <span>Unread Leads</span>
          <span className="font-bold text-gray-700">0</span>
        </li>

        <li className="flex justify-between border-b pb-1">
          <span>Orders Missing Measurements</span>
          <span className="font-bold text-gray-700">0</span>
        </li>

        <li className="flex justify-between border-b pb-1">
          <span>Pending Partner Payouts</span>
          <span className="font-bold text-gray-700">0</span>
        </li>

        <li className="flex justify-between border-b pb-1">
          <span>Invoices Needing Approval</span>
          <span className="font-bold text-gray-700">0</span>
        </li>

        <li className="flex justify-between">
          <span>Leads Older Than 48 Hours</span>
          <span className="font-bold text-gray-700">0</span>
        </li>
      </ul>
    </div>
  )}
</div>





      {/* =================== SYSTEM HEALTH (leave it) =================== */}
      <Panel title="System Health" style={{ marginTop: 20 }}>
        <Row label="API Status" value="✅ Online" />
        <Row label="Lead Sync" value="✅ Live" />
        <Row label="Commission Sync" value="✅ Live" />
        <Row label="Payout Engine" value="🟡 Simulated Mode" />
      </Panel>
    </div>
  );
}

// =================== COMPONENTS ===================
function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div
      style={{
        ...cardStyle,
        height: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 13, color: "#444" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  style,
}: {
  title: string;
  children: any;
  style?: any;
}) {
  return (
    <div style={{ ...panelStyle, ...style }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "6px 0",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #eee",
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// =================== STYLES ===================
const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 16,
  background: "white",
};

const panelStyle = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 16,
  background: "white",
};

const gridThree = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
};

const gridFour = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 12,
};


const gridTwo = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 12,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const thTd = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  textAlign: "left" as const,
};

function fmt(n: number) {
  return "$" + n.toLocaleString();
}
