"use client";

import { useEffect, useState } from "react";

type Counts = {
  pending: number;
  scanning: number;
  done: number;
  failed: number;
};

export default function PageScannerPage() {
  const [counts, setCounts] = useState<Counts>({
    pending: 0,
    scanning: 0,
    done: 0,
    failed: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* -----------------------------
     FETCHERS
  ----------------------------- */

  async function fetchCounts() {
    const res = await fetch("/api/page-scan/status");
    const data = await res.json();
    setCounts(data);
  }

  /* -----------------------------
     ACTIONS
  ----------------------------- */

  async function seedJobs() {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/page-scan/seed", { method: "POST" });
    const data = await res.json();

    setMessage(data.message || "Jobs seeded");
    setLoading(false);
    fetchCounts();
  }

  async function runBatch(size: number) {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/page-scan/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchSize: size }),
    });

    const data = await res.json();
    setMessage(`Scanned ${data.scanned || 0} pages`);
    setLoading(false);
    fetchCounts();
  }

  /* -----------------------------
     AUTO REFRESH COUNTS
  ----------------------------- */

  useEffect(() => {
    fetchCounts();

    const interval = setInterval(() => {
      fetchCounts();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* -----------------------------
     STATUS LOGIC
  ----------------------------- */

  let statusText = "Idle";
  let statusColor = "bg-gray-300";

  if (counts.scanning < 1) {
    statusText = "Scanning in progress…";
    statusColor = "bg-blue-500 animate-pulse";
  } else if (counts.pending > 0) {
    statusText = "Queued — ready to scan";
    statusColor = "bg-yellow-400";
  } else if ( counts.pending === 0) {
    statusText = "All scans complete";
    statusColor = "bg-green-500";
  }

  /* -----------------------------
     UI
  ----------------------------- */

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Page Scanner</h1>

      {/* ✅ STATUS BAR */}
      <div className="w-full">
        <div className="text-sm mb-1 text-gray-600">{statusText}</div>
        <div className="h-3 w-full rounded bg-gray-200 overflow-hidden">
          <div className={`h-full ${statusColor}`} style={{ width: "100%" }} />
        </div>
      </div>

      {/* ✅ COUNTS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {(["pending", "scanning", "done", "failed"] as const).map((key) => (
          <div key={key} className="border p-4 rounded">
            <div className="text-sm text-gray-500 capitalize">{key}</div>
            <div className="text-xl font-semibold">{counts[key]}</div>
          </div>
        ))}
      </div>

      {/* ✅ ACTIONS */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={seedJobs}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Seed Scan Jobs
        </button>

        <button
          onClick={() => runBatch(50)}
          disabled={loading}
          className="px-4 py-2 border rounded"
        >
          Scan
        </button>
      </div>

      {message && (
        <div className="text-sm text-green-600">{message}</div>
      )}
    </div>
  );
}
