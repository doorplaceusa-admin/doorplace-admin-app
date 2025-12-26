"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type Row = {
  id: string;
  lead_id: string;
  submission_type: string;

  partner_id?: string;

  customer_first_name?: string;
  customer_last_name?: string;

  swing_price?: number | string;
  accessory_price?: number | string;

  order_status?: string;
  commission_status?: string;
  notes?: string;
  created_at?: string;
};

/* ===============================
   HELPERS
================================ */
function toNum(v: any) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

/* ===============================
   PAGE
================================ */
export default function PartnerCommissionsPage() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<"orders" | "leads">("orders");

  const [dateRange, setDateRange] =
    useState<"30" | "60" | "90" | "all">("all");

  /* ===============================
     LOAD PARTNER ID (FROM TAGS)
  ================================ */
  async function loadPartnerId() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      console.warn("No logged in user");
      return;
    }

    const tags =
      (data.user.user_metadata?.tags as string | undefined) || "";

    const foundPartnerId = tags
      .split(",")
      .map((t) => t.trim())
      .find((t) => t.startsWith("DP"));

    if (!foundPartnerId) {
      console.warn("Partner ID not found in tags:", tags);
      return;
    }

    setPartnerId(foundPartnerId);
  }

  /* ===============================
     LOAD DATA (PARTNER SCOPED)
  ================================ */
  async function loadData() {
    if (!partnerId) return;

    setLoading(true);

    console.log("🔍 loadData()");
    console.log("🆔 Partner ID:", partnerId);

    let query = supabase
      .from("leads")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });

    if (dateRange !== "all") {
      const days = Number(dateRange);
      const since = new Date();
      since.setDate(since.getDate() - days);
      query = query.gte("created_at", since.toISOString());
    }

    const { data, error } = await query;

    console.log("📦 Rows:", data);
    console.log("❌ Error:", error);

    setRows(data || []);
    setLoading(false);
  }

  /* ===============================
     EFFECTS
  ================================ */
  useEffect(() => {
    loadPartnerId();
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    loadData();
  }, [partnerId, dateRange]);

  /* ===============================
     FILTERS
  ================================ */
  const orders = useMemo(
    () => rows.filter((r) => r.submission_type === "partner_order"),
    [rows]
  );

  const leads = useMemo(
    () => rows.filter((r) => r.submission_type !== "partner_order"),
    [rows]
  );

  /* ===============================
     SUMMARY TOTALS
  ================================ */
  const totals = useMemo(() => {
    let commission = 0;
    let paid = 0;
    let pending = 0;

    orders.forEach((o) => {
      const base =
        toNum(o.swing_price) + toNum(o.accessory_price);
      const c = Math.round(base * 0.12 * 100) / 100;
      commission += c;

      if (o.commission_status === "paid") paid += c;
      else pending += c;
    });

    return {
      totalLeads: leads.length,
      totalOrders: orders.length,
      totalCommission: commission,
      paid,
      pending,
    };
  }, [orders, leads]);

  /* ===============================
     CSV EXPORT
  ================================ */
  function exportCSV() {
    const headers = [
      "ID",
      "Customer",
      "Swing Price",
      "Accessory Price",
      "Commission",
      "Status",
      "Notes",
    ];

    const lines = orders.map((o) => {
      const base =
        toNum(o.swing_price) + toNum(o.accessory_price);
      const commission = Math.round(base * 0.12 * 100) / 100;

      return [
        o.lead_id,
        `${o.customer_first_name || ""} ${o.customer_last_name || ""}`,
        toNum(o.swing_price),
        toNum(o.accessory_price),
        commission,
        o.commission_status || "",
        o.notes || "",
      ].join(",");
    });

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Commissions</h1>

        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={dateRange}
            onChange={(e) =>
              setDateRange(e.target.value as any)
            }
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <button
            onClick={exportCSV}
            className="border rounded px-3 py-2 text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card label="Total Leads" value={totals.totalLeads} />
        <Card label="Total Orders" value={totals.totalOrders} />
        <Card
          label="Total Commission"
          value={money(totals.totalCommission)}
        />
        <Card label="Paid" value={money(totals.paid)} />
        <Card label="Pending" value={money(totals.pending)} />
      </div>

      <div className="flex gap-2">
        <Tab active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
          Orders
        </Tab>
        <Tab active={activeTab === "leads"} onClick={() => setActiveTab("leads")}>
          Leads
        </Tab>
      </div>

      {activeTab === "orders" && (
        <Table>
          {orders.length === 0 && <Empty>No orders yet.</Empty>}
          {orders.map((o) => {
            const base =
              toNum(o.swing_price) + toNum(o.accessory_price);
            const commission =
              Math.round(base * 0.12 * 100) / 100;

            return (
              <RowItem key={o.id}>
                <div>{o.lead_id}</div>
                <div>
                  {o.customer_first_name} {o.customer_last_name}
                </div>
                <div>{money(commission)}</div>
                <div>{o.commission_status || "—"}</div>
                <div className="text-gray-500">{o.notes || "—"}</div>
              </RowItem>
            );
          })}
        </Table>
      )}

      {activeTab === "leads" && (
        <Table>
          {leads.length === 0 && <Empty>No leads yet.</Empty>}
          {leads.map((l) => (
            <RowItem key={l.id}>
              <div>{l.lead_id}</div>
              <div>
                {l.customer_first_name} {l.customer_last_name}
              </div>
              <div>{l.order_status || "New"}</div>
              <div className="text-gray-500">{l.notes || "—"}</div>
            </RowItem>
          ))}
        </Table>
      )}

      <div className="pt-6 text-center">
        <a
          href="https://doorplaceusa.com/account"
          className="inline-block px-4 py-2 border border-gray-400 rounded text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}

/* ===============================
   UI
================================ */
function Card({ label, value }: any) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function Tab({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${
        active ? "bg-red-700 text-white" : "bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Table({ children }: any) {
  return (
    <div className="border rounded divide-y text-sm">
      {children}
    </div>
  );
}

function RowItem({ children }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3">
      {children}
    </div>
  );
}

function Empty({ children }: any) {
  return (
    <div className="p-6 text-center text-gray-500">
      {children}
    </div>
  );
}
