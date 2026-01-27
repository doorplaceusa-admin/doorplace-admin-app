"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  topPages: { page: string; clicks: number }[];
  topQueries: { query: string; impressions: number }[];
  updatedAt: string;
};

export default function GoogleSearchConsolePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/google/dashboard", { cache: "no-store" });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function runSync() {
    if (syncing) return;
    setSyncing(true);

    await fetch("/api/google/search-console/sync", {
      method: "POST",
    });

    await loadData();
    setSyncing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return <div style={{ padding: 24 }}>Loading Search Console…</div>;
  }

  const { summary, topPages, topQueries } = data;

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24 }}>Google Search Console</h1>

        <button
          onClick={runSync}
          disabled={syncing}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #111",
            background: syncing ? "#e5e7eb" : "#111",
            color: syncing ? "#111" : "#fff",
            cursor: syncing ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      {/* SUMMARY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Metric label="Clicks" value={summary.totalClicks} />
        <Metric label="Impressions" value={summary.totalImpressions} />
        <Metric label="Avg CTR" value={`${summary.avgCtr.toFixed(2)}%`} />
        <Metric label="Avg Position" value={summary.avgPosition.toFixed(1)} />
      </div>

      {/* TOP PAGES */}
      <Section title="Top Pages">
        {topPages.map((row, i) => (
          <Row key={i} left={row.page} right={`${row.clicks} clicks`} />
        ))}
      </Section>

      {/* TOP QUERIES */}
      <Section title="Top Queries">
        {topQueries.map((row, i) => (
          <Row
            key={i}
            left={row.query}
            right={`${row.impressions} impressions`}
          />
        ))}
      </Section>
    </div>
  );
}

/* UI */

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>{title}</h2>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  left,
  right,
}: {
  left: string | null;
  right: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 12,
        borderBottom: "1px solid #e5e7eb",
        fontSize: 14,
      }}
    >
      <span
        style={{
          maxWidth: "70%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {left || "—"}
      </span>
      <span style={{ color: "#374151" }}>{right}</span>
    </div>
  );
}
