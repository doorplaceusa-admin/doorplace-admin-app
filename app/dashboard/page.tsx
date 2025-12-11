"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const BRAND_RED = "#B80D0D";
const ADMIN_EMAILS = ["admin@doorplaceusa.com", "thomas@doorplaceusa.com"];

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
  const [email, setEmail] = useState<string | null>(null);
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
  const [partnerPerformance, setPartnerPerformance] = useState<
    { partner_id: string; revenue: number; orders: number }[]
  >([]);

  const isAdmin = email && ADMIN_EMAILS.includes(email);

  useEffect(() => {
    getUser();
    loadDashboard();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setEmail(data?.user?.email || null);
  }

  async function loadDashboard() {
    setLoading(true);

    // MOCK TEMP DATA
    setStats({
      totalLeads: 312,
      totalOrders: 94,
      totalRevenue: 48210,
      pendingCommissions: 3760,
      paidCommissions: 31800,
      activePartners: 14,
      conversionRate: 30.1,
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

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        paddingBottom: "40px",
        overflowX: "hidden",
      }}
    >
      {/* TOP BRAND HEADER */}
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
          Trade Pilot
        </h1>
        <div
          style={{
            color: BRAND_RED,
            fontSize: "15px",
            marginTop: "2px",
            fontWeight: 600,
          }}
        >
          Powered by Doorplace USA
        </div>

        <h2
          style={{
            marginTop: "18px",
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          Admin Dashboard
        </h2>
      </div>

      {/* FIRST ROW */}
      <div style={gridThree}>
        <StatCard title="Total Leads" value={stats.totalLeads.toString()} />
        <StatCard title="Total Orders" value={stats.totalOrders.toString()} />
        <StatCard title="Active Partners" value={stats.activePartners.toString()} />
      </div>

      {/* SECOND ROW */}
      <div style={{ ...gridThree, marginTop: "16px" }}>
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} />

        {isAdmin && (
          <StatCard title="Total Revenue" value={fmtMoney(stats.totalRevenue)} />
        )}

        <StatCard
          title="Pending Commissions"
          value={fmtMoney(stats.pendingCommissions)}
        />
      </div>

      {/* THIRD ROW */}
      <div style={{ ...gridTwo, marginTop: "20px" }}>
        <StatCard title="Paid Commissions" value={fmtMoney(stats.paidCommissions)} />

        <StatCard
          title="Avg Order Value"
          value={
            stats.totalOrders > 0
              ? fmtMoney(stats.totalRevenue / stats.totalOrders)
              : "$0"
          }
        />
      </div>

      {/* VISUALS */}
      <div style={{ ...gridTwo, marginTop: "20px" }}>
        <div style={panelStyle}>
          <h3 style={panelTitle}>Revenue Performance</h3>
          <BarChart
            values={[
              stats.pendingCommissions,
              stats.paidCommissions,
              stats.totalRevenue,
            ]}
            labels={["Pending", "Paid", "Total"]}
          />
        </div>

        <div style={panelStyle}>
          <h3 style={panelTitle}>Lead → Order Conversion</h3>
          <ProgressRing percent={stats.conversionRate} />
        </div>
      </div>

      {/* RECENT LISTS */}
      <div style={{ ...gridTwo, marginTop: "20px" }}>
        <div style={panelStyle}>
          <h3 style={panelTitle}>Recent Leads</h3>
          {recentLeads.map((l) => (
            <Row key={l.id} label={l.label} value={l.date} />
          ))}
        </div>

        <div style={panelStyle}>
          <h3 style={panelTitle}>Recent Orders</h3>
          {recentOrders.map((o) => (
            <Row
              key={o.id}
              label={o.label}
              value={`${o.date} — ${fmtMoney(o.amount || 0)}`}
            />
          ))}
        </div>
      </div>

      {/* TOP PARTNERS */}
      <div style={{ marginTop: "20px", ...panelStyle }}>
        <h3 style={panelTitle}>Top Partner Performance</h3>
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
                <td style={thTd}>{fmtMoney(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SYSTEM HEALTH */}
      <div style={{ marginTop: "20px", ...panelStyle }}>
        <h3 style={panelTitle}>System Health</h3>
        <Row label="API Status" value="✅ Online" />
        <Row label="Lead Sync" value="✅ Live" />
        <Row label="Commission Sync" value="✅ Live" />
        <Row label="Payout Engine" value="🟡 Simulated Mode" />
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          color: "#444",
          fontSize: "14px",
          paddingBottom: "30px",
        }}
      >
        Built by Doorplace USA
      </div>
    </div>
  );
}

// ================= UI COMPONENTS =================
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px", textAlign: "center" }}>
        {title}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, textAlign: "center" }}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: "14px",
        borderBottom: "1px solid #eee",
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: "150px" }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              height: `${(v / max) * 120}px`,
              background: BRAND_RED,
              margin: "0 6px",
              borderRadius: "6px 6px 0 0",
            }}
          />
          <div style={{ fontSize: "12px", marginTop: "4px" }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  return (
    <div
      style={{
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        border: "10px solid #eee",
        borderTop: `10px solid ${BRAND_RED}`,
        transform: "rotate(" + percent * 3.6 + "deg)",
        margin: "0 auto",
      }}
    />
  );
}

// ================= STYLES =================
function fmtMoney(value: number) {
  return "$" + value.toLocaleString();
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "16px",
  background: "white",
  height: "95px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "16px",
  background: "white",
};

const panelTitle: React.CSSProperties = {
  margin: 0,
  marginBottom: "12px",
  fontSize: "17px",
  fontWeight: 700,
};

const gridThree: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "8px",
};

const thTd: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px 10px",
  fontSize: "13px",
};
