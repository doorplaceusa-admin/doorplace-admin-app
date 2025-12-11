"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
  const [partnerPerformance, setPartnerPerformance] = useState<
    { partner_id: string; revenue: number; orders: number }[]
  >([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    // MOCK DATA (connect to real later)
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
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Executive Command Dashboard</h2>
      <p style={{ marginBottom: "24px" }}>
        Live intelligence across leads, partners, revenue, orders, and commissions.
      </p>

      {/* ============ FIRST TWO ROWS — 3 CARDS EACH ============ */}
      <div style={gridThree}>
        <StatCard title="Total Leads" value={stats.totalLeads.toString()} />
        <StatCard title="Total Orders" value={stats.totalOrders.toString()} />
        <StatCard title="Active Partners" value={stats.activePartners.toString()} />
      </div>

      <div style={{ ...gridThree, marginTop: "16px" }}>
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} />
        <StatCard title="Total Revenue" value={fmtMoney(stats.totalRevenue)} />
        <StatCard
          title="Pending Commissions"
          value={fmtMoney(stats.pendingCommissions)}
        />
      </div>

      {/* ============ NEX T ROWS — 2 CARDS EACH ============ */}
      <div style={{ ...gridTwo, marginTop: "20px" }}>
        <StatCard title="Paid Commissions" value={fmtMoney(stats.paidCommissions)} />
        <StatCard
          title="Avg Order Value"
          value={fmtMoney(stats.totalRevenue / stats.totalOrders)}
        />
      </div>

      <div style={{ ...gridTwo, marginTop: "20px" }}>
        <div style={panelStyle}>
          <h3>Revenue Performance (Visual)</h3>
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
          <h3>Lead → Order Conversion</h3>
          <ProgressRing percent={stats.conversionRate} />
        </div>
      </div>

      <div style={{ ...gridTwo, marginTop: "20px" }}>
        <div style={panelStyle}>
          <h3>Recent Leads</h3>
          {recentLeads.map((l) => (
            <Row key={l.id} label={l.label} value={l.date} />
          ))}
        </div>

        <div style={panelStyle}>
          <h3>Recent Orders</h3>
          {recentOrders.map((o) => (
            <Row
              key={o.id}
              label={o.label}
              value={`${o.date} — ${fmtMoney(o.amount || 0)}`}
            />
          ))}
        </div>
      </div>

      {/* ============ LARGE 1-CARD ROWS ============ */}
      <div style={{ marginTop: "20px", ...panelStyle }}>
        <h3>Top Partner Performance</h3>
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

      <div style={{ marginTop: "20px", ...panelStyle }}>
        <h3>System Health</h3>
        <Row label="API Status" value="✅ Online" />
        <Row label="Lead Sync" value="✅ Live" />
        <Row label="Commission Sync" value="✅ Live" />
        <Row label="Payout Engine" value="🟡 Simulated Mode" />
      </div>
    </div>
  );
}

// ================= UI COMPONENTS =================
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>
        {title}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700 }}>{value}</div>
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

function BarChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const max = Math.max(...values);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: "160px" }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              height: `${(v / max) * 140}px`,
              background: "#007bff",
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
        width: "140px",
        height: "140px",
        borderRadius: "50%",
        border: "10px solid #eee",
        borderTop: "10px solid #28a745",
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
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "16px",
  background: "white",
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
