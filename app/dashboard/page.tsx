"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminPresence } from "@/app/components/presence/AdminPresenceContext";
import LiveUSMap from "@/app/components/LiveUSMap";

const brandRed = "#b80d0d";

// ✅ Refresh rates
const LIVE_MAP_REFRESH_MS = 15000; // 15s (fast)
const STATS_REFRESH_MS = 300000; // 5 min (slow)

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

  // ✅ LIVE MAP VISITORS
  const [liveVisitors, setLiveVisitors] = useState<any[]>([]);

  const [partnerPerformance, setPartnerPerformance] = useState<
    { partner_id: string; revenue: number; orders: number }[]
  >([]);

  const [sessionEmail, setSessionEmail] = useState<string>("");

  // ✅ prevent overlapping queries
  const inflightStats = useRef(false);
  const inflightMap = useRef(false);

  // ==========================================
  // ✅ LIVE MAP (FAST)
  // ==========================================
  async function loadLiveMap() {
    if (inflightMap.current) return;
    inflightMap.current = true;

    try {
      const { data, error } = await supabase
        .from("live_map_activity")
 // ✅ same view as Analytics
        .select("*"); // ✅ IMPORTANT: let LiveUSMap get whatever fields it needs

      if (error) {
        console.error("LIVE MAP ERROR:", error);
        return;
      }

      // Optional: normalize lat/lon if needed
      const normalized =
        (data || []).map((r: any) => ({
          ...r,
          latitude:
            typeof r.latitude === "string" ? parseFloat(r.latitude) : r.latitude,
          longitude:
            typeof r.longitude === "string"
              ? parseFloat(r.longitude)
              : r.longitude,
        })) ?? [];

      setLiveVisitors(normalized);
    } finally {
      inflightMap.current = false;
    }
  }

  // ==========================================
  // ✅ DASHBOARD STATS (SLOW)
  // ==========================================
  async function loadStatsAndCards() {
    if (inflightStats.current) return;
    inflightStats.current = true;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("active_company_id, role")
        .eq("id", userId)
        .single();

      if (profileErr || !profile?.active_company_id) {
        console.error("NO COMPANY ID", profileErr, profile);
        setLoading(false);
        return;
      }

      const companyId = profile.active_company_id;

      const { data: sess } = await supabase.auth.getSession();
      setSessionEmail(sess.session?.user.email || "");

      // ✅ NOTE:
      // Some of these are global counts (no company filter) because I don't want to break you
      // if your partners table doesn't have company_id.
      // If partners DOES have company_id, tell me and we’ll filter them (big speed-up).

      const [
  totalPartnersRes,
  activatedPartnersRes,
  pendingPartnersRes,
  activePartnersRes,

  siteMetricsRes,

  leadCountRes,
  orderCountRes,
  leadsDataRes,
] = await Promise.all([
  supabase.from("partners").select("*", { count: "estimated", head: true }),

  supabase
    .from("partners")
    .select("*", { count: "estimated", head: true })
    .not("auth_user_id", "is", null),

  supabase
    .from("partners")
    .select("*", { count: "estimated", head: true })
    .eq("status", "pending"),

  supabase
    .from("partners")
    .select("*", { count: "estimated", head: true })
    .eq("status", "active"),

  // ✅ LIFETIME TOTALS (FAST)
  supabase
    .from("site_metrics")
    .select(
      "lifetime_site_views,lifetime_partner_views,lifetime_app_views"
    )
    .eq("company_id", companyId)
    .maybeSingle(),

  supabase
    .from("leads")
    .select("*", { count: "estimated", head: true })
    .eq("company_id", companyId)
    .neq("submission_type", "partner_order"),

  supabase
    .from("leads")
    .select("*", { count: "estimated", head: true })
    .eq("company_id", companyId)
    .eq("submission_type", "partner_order"),

  supabase
    .from("leads")
    .select(
      `
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
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(3),
]);


      // ================================
      // ✅ STEP 1 DEBUG LOGS (PASTE HERE)
      // ================================

      console.log("🔥 companyId:", companyId);

      console.log("🔥 siteMetricsRes:", {
        data: siteMetricsRes.data,
        error: siteMetricsRes.error,
      });

      

      const totalPartnersCount = totalPartnersRes.count || 0;
      const activatedPartnersCount = activatedPartnersRes.count || 0;
      const pendingPartners = pendingPartnersRes.count || 0;
      const activePartners = activePartnersRes.count || 0;

      // ✅ Lifetime totals from site_metrics (stable forever)
const totalSiteViews =
  siteMetricsRes.data?.lifetime_site_views ?? 0;

const partnerTrackingViews =
  siteMetricsRes.data?.lifetime_partner_views ?? 0;

if (!siteMetricsRes.data) {
  console.warn("⚠️ No site_metrics row yet for company:", companyId);
}




      const leadCount = leadCountRes.count || 0;
      const orderCount = orderCountRes.count || 0;

      const leadsData = leadsDataRes.data || [];

      const mappedRecentLeads: RecentItem[] = (leadsData || []).map((l: any) => {
        const who =
          [l.customer_first_name, l.customer_last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || l.email || l.phone || "Lead";

        const what =
          l.product_type || l.swing_size
            ? `${l.product_type || "Product"}${l.swing_size ? ` • ${l.swing_size}` : ""}`
            : "Request";

        const date = l.created_at
          ? new Date(l.created_at).toISOString().split("T")[0]
          : "";

        return {
          id: String(l.lead_id),
          label: `${who} – ${what}`,
          date,
        };
      });

      const totalAppViews =
  siteMetricsRes.data?.lifetime_app_views ?? 0;

      setPartnerSnapshot({
        total: totalPartnersCount,
        activated: activatedPartnersCount,
        pending: pendingPartners,
        active: activePartners,
      });

      setStats({
        totalLeads: leadCount,
        totalOrders: orderCount,
        totalRevenue: 0,
        pendingCommissions: 0,
        paidCommissions: 0,
        activePartners: activatedPartnersCount,
        conversionRate: 0,
        totalAppViews,
        totalSiteViews,
        partnerTrackingViews,
      });

      setRecentLeads(mappedRecentLeads);

      // kept as-is (your placeholder)
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
    } finally {
      inflightStats.current = false;
    }
  }

  // ==========================================
  // ✅ EFFECT: load + refresh loops
  // ==========================================
  useEffect(() => {
    // initial load
    loadLiveMap();
    loadStatsAndCards();

    // fast loop: map
    const mapInterval = setInterval(() => {
      loadLiveMap();
    }, LIVE_MAP_REFRESH_MS);

    // slow loop: stats/cards
    const statsInterval = setInterval(() => {
      loadStatsAndCards();
    }, STATS_REFRESH_MS);

    return () => {
      clearInterval(mapInterval);
      clearInterval(statsInterval);
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  const isAdmin =
    sessionEmail === "admin@doorplaceusa.com" ||
    sessionEmail === "thomas@doorplaceusa.com";

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-375 w-full mx-auto">
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

        <StatCard title="Online" value={totalOnline} />
        <StatCard title="Doorplace Site Views" value={stats.totalSiteViews} />
        <StatCard title="Total App Views" value={stats.totalAppViews} />
        <StatCard
          title="Partner Tracking Link Views"
          value={stats.partnerTrackingViews}
        />
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


      {/* =================== SYSTEM HEALTH =================== */}
      <Panel title="System Health" style={{ marginTop: 20 }}>
        <Row label="API Status" value="✅ Online" />
        <Row label="Lead Sync" value="✅ Live" />
        <Row label="Commission Sync" value="✅ Live" />
      
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
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>
        {title}
      </h3>
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

function fmt(n: number) {
  return "$" + n.toLocaleString();
}
