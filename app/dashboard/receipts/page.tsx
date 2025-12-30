"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

type Receipt = {
  id: string;
  created_at: string;
  vendor?: string;
  total?: number;
  image_url?: string;
};

type TotalsResponse = {
  totals: {
    total_spend: number;
    total_items: number;
  };
  by_item: Record<string, { quantity: number; total: number }>;
  by_month: Record<string, number>;
};

export default function ReceiptsDashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [totals, setTotals] = useState<TotalsResponse | null>(null);

  /* ===============================
     FETCH RECEIPTS + TOTALS
  =============================== */
  async function loadReceipts() {
    const res = await fetch("/api/receipts/uploads");
    if (res.ok) {
      const data = await res.json();
      setReceipts(data);
    }
  }

  async function loadTotals() {
    const res = await fetch("/api/receipts/totals");
    if (res.ok) {
      setTotals(await res.json());
    }
  }

  useEffect(() => {
    loadReceipts();
    loadTotals();
  }, []);

  /* ===============================
     UPLOAD RECEIPT
  =============================== */
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("receipt", file);

    const res = await fetch("/api/receipts/uploads", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (res.ok) {
      setFile(null);
      await loadReceipts();
      await loadTotals();
    } else {
      alert("Upload failed");
    }
  }

  /* ===============================
     FILTER + SORT
  =============================== */
  const filtered = useMemo(() => {
    let data = [...receipts];

    if (search) {
      data = data.filter(
        (r) =>
          r.vendor?.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    data.sort((a, b) =>
      sort === "newest"
        ? new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
    );

    return data;
  }, [receipts, search, sort]);

  const totalSpend = filtered.reduce(
    (sum, r) => sum + (r.total || 0),
    0
  );

  /* ===============================
     CHART DATA
  =============================== */
  const itemChartData = totals
    ? Object.entries(totals.by_item).map(([name, v]) => ({
        name,
        total: v.total,
      }))
    : [];

  const monthChartData = totals
    ? Object.entries(totals.by_month).map(([month, count]) => ({
        month,
        count,
      }))
    : [];

  /* ===============================
     RENDER
  =============================== */
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#b80d0d" }}>Receipts</h2>

      {/* UPLOAD */}
      <form onSubmit={handleUpload} style={{ marginBottom: 20 }}>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <button style={{ marginLeft: 10 }} disabled={loading}>
          {loading ? "Uploading..." : "Upload Receipt"}
        </button>
      </form>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          placeholder="Search vendor or receipt ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* SUMMARY */}
      <div style={{ fontWeight: 600, marginBottom: 20 }}>
        Total Receipts: {filtered.length} &nbsp;|&nbsp; Total Spend: $
        {totalSpend.toFixed(2)}
      </div>

      {/* TABLE */}
      <table
        width="100%"
        style={{
          borderCollapse: "collapse",
          background: "#fff",
          border: "1px solid #ddd",
        }}
      >
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th style={th}>Date</th>
            <th style={th}>Vendor</th>
            <th style={th}>Total</th>
            <th style={th}>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 14, textAlign: "center" }}>
                No receipts yet
              </td>
            </tr>
          )}

          {filtered.map((r) => (
            <tr key={r.id}>
              <td style={td}>
                {new Date(r.created_at).toLocaleDateString()}
              </td>
              <td style={td}>{r.vendor || "—"}</td>
              <td style={td}>
                {r.total ? `$${r.total.toFixed(2)}` : "—"}
              </td>
              <td style={td}>
                {r.image_url ? (
                  <a
                    href={r.image_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#b80d0d", fontWeight: 600 }}
                  >
                    View
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CHARTS */}
      {totals && (
        <>
          <h3 style={{ marginTop: 40 }}>Top Items by Spend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={itemChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#b80d0d" />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={{ marginTop: 40 }}>Receipts by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthChartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line dataKey="count" stroke="#b80d0d" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

/* ===============================
   STYLES
=============================== */
const th: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #ddd",
};

const td: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};
