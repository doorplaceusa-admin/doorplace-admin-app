"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";



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
};

type RecentItem = {
  id: string;
  label: string;
  date: string;
  amount?: number;
};

// ================= PAGE =================
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    activePartners: 0,
    conversionRate: 0,
  });

  const [recentLeads, setRecentLeads] = useState<RecentItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentItem[]>([]);
  const [partnerPerformance, setPartnerPerformance] =
    useState<{ partner_id: string; revenue: number; orders: number }[]>([]);

  const [sessionEmail, setSessionEmail] = useState<string>("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      setSessionEmail(data.session?.user.email || "");

      const { count } = await supabase
  .from("partners")
  .select("*", { count: "exact", head: true })
  .eq("shopify_synced", true);

setStats({
  totalLeads: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingCommissions: 0,
  paidCommissions: 0,
  activePartners: count || 0,
  conversionRate: 0,
});


      setRecentLeads([
        { id: "1", label: "John – Porch Swing", date: "2025-12-07" },
        { id: "2", label: "Ashley – Dutch Door", date: "2025-12-06" },
        { id: "3", label: "Mark – Barn Door", date: "2025-12-06" },
      ]);

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
  }, []);

  if (loading) return <div>Loading...</div>;

  const isAdmin =
    sessionEmail === "admin@doorplaceusa.com" ||
    sessionEmail === "thomas@doorplaceusa.com";

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto" }}>

      {/* =================== HEADER =================== */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: brandRed }}>
          TradePilot
        </h1>

        <div className="text-sm font-medium" style={{ color: brandRed }}>
          Powered by Doorplace USA
        </div>

        <div className="mt-2 text-xl font-semibold border-b pb-1">
          Admin Dashboard
        </div>
      </div>

{/* ===================== QUICK ACTIONS BAR ===================== */}
<div style={{
  display: "flex",
  gap: "12px",
  marginBottom: "20px"
}}>
  <button
    style={{
      background: "#b80d0d",
      color: "white",
      padding: "10px 16px",
      borderRadius: "6px",
      fontWeight: "600",
      cursor: "pointer"
    }}
    onClick={() => window.location.href = "/dashboard/leads?create=new"}
  >
    + New Lead
  </button>

  <button
    style={{
      background: "#b80d0d",
      color: "white",
      padding: "10px 16px",
      borderRadius: "6px",
      fontWeight: "600",
      cursor: "pointer"
    }}
    onClick={() => window.location.href = "/dashboard/orders?create=new"}
  >
    + New Order
  </button>

  <button
    style={{
      background: "#b80d0d",
      color: "white",
      padding: "10px 16px",
      borderRadius: "6px",
      fontWeight: "600",
      cursor: "pointer"
    }}
    onClick={() => window.location.href = "/dashboard/partners?create=new"}
  >
    + Add Partner
  </button>
</div>


      {/* =================== SUMMARY CARDS =================== */}
      <div style={gridThree}>
        <StatCard title="Total Leads" value={stats.totalLeads} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <div onClick={() => window.location.href = "/dashboard/partners"} style={{ cursor: "pointer" }}>
  <StatCard title="Active Partners" value={stats.activePartners} />
</div>

      </div>

      <div style={{ ...gridThree, marginTop: 16 }}>
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} />
        {isAdmin && <StatCard title="Total Revenue" value={fmt(stats.totalRevenue)} />}
        <StatCard title="Pending Commissions" value={fmt(stats.pendingCommissions)} />
      </div>

      <div style={{ ...gridTwo, marginTop: 16 }}>
        <StatCard title="Paid Commissions" value={fmt(stats.paidCommissions)} />
        <StatCard title="Avg Order Value" value={fmt(stats.totalRevenue / stats.totalOrders)} />
      </div>

{/* 🟡 TASKS REQUIRING ATTENTION */}
<div className="bg-white p-4 rounded shadow mb-6">
  <h2 className="text-lg font-semibold mb-3" style={{ color: "#b80d0d" }}>
    Tasks Requiring Attention
  </h2>

  <ul className="space-y-2">

    {/* Unread Leads */}
    <li className="flex justify-between border-b pb-1">
      <span>Unread Leads</span>
      <span className="font-bold text-gray-700">0</span>
    </li>

    {/* Missing Measurements */}
    <li className="flex justify-between border-b pb-1">
      <span>Orders Missing Measurements</span>
      <span className="font-bold text-gray-700">0</span>
    </li>

    {/* Pending Partner Payouts */}
    <li className="flex justify-between border-b pb-1">
      <span>Pending Partner Payouts</span>
      <span className="font-bold text-gray-700">0</span>
    </li>

    {/* Invoices Needing Approval */}
    <li className="flex justify-between border-b pb-1">
      <span>Invoices Needing Approval</span>
      <span className="font-bold text-gray-700">0</span>
    </li>

    {/* Leads older than 48 hours */}
    <li className="flex justify-between">
      <span>Leads Older Than 48 Hours</span>
      <span className="font-bold text-gray-700">0</span>
    </li>

  </ul>
</div>


      {/* =================== RECENT LEADS + ORDERS =================== */}
      <div style={{ ...gridTwo, marginTop: 20 }}>
        <Panel title="Recent Leads">
          {recentLeads.map((l) => (
            <Row key={l.id} label={l.label} value={l.date} />
          ))}
        </Panel>

        <Panel title="Recent Orders">
          {recentOrders.map((o) => (
            <Row
              key={o.id}
              label={o.label}
              value={`${o.date} — ${fmt(o.amount || 0)}`}
            />
          ))}
        </Panel>
      </div>

      {/* =================== LEADERBOARD =================== */}
      <Panel title="Top Partner Performance" style={{ marginTop: 20 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTd}>Partner</th>
              <th style={thTd}>Orders</th>
              <th style={thTd}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {partnerPerformance.map((p) => (
              <tr key={p.partner_id}>
                <td style={thTd}>{p.partner_id}</td>
                <td style={thTd}>{p.orders}</td>
                <td style={thTd}>{fmt(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* =================== SYSTEM HEALTH =================== */}
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
