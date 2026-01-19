"use client";

import { useState } from "react";

export default function SitemapScannerPage() {
  const [inputUrl, setInputUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Classification UI state
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [statusType, setStatusType] =
    useState<"idle" | "working" | "done" | "error">("idle");

  async function runScan() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/sitemap/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_url: inputUrl,
          company_name: companyName,
          is_internal: isInternal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runClassification() {
    setProcessing(true);
    setStatusType("working");
    setStatusText("Classifying sitemap URLs…");

    try {
      const res = await fetch("/api/sitemap/classify", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Classification failed");

      setStatusType("done");
      setStatusText("Classification completed successfully.");
    } catch (err: any) {
      setStatusType("error");
      setStatusText(err.message || "Classification failed.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Sitemap Scanner
      </h1>

      <div className="space-y-4">
        <input
          className="w-full border px-4 py-2 rounded"
          placeholder="Company name (ex: SERVPRO)"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
        />

        <input
          className="w-full border px-4 py-2 rounded"
          placeholder="Main URL (https://www.servpro.com)"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={e => setIsInternal(e.target.checked)}
          />
          Internal site (DoorPlace USA)
        </label>

        <button
          onClick={runScan}
          disabled={loading || !inputUrl || !companyName}
          className="bg-black text-white px-5 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Get Sitemap"}
        </button>

        <button
          onClick={runClassification}
          disabled={processing}
          className="border border-black px-5 py-2 rounded disabled:opacity-50"
        >
          {processing ? "Classifying…" : "Classify Sitemap URLs"}
        </button>
      </div>

      {/* Scan Errors */}
      {error && (
        <div className="mt-6 text-red-600">
          {error}
        </div>
      )}

      {/* Scan Result */}
      {result && (
        <div className="mt-6 border rounded p-4 bg-gray-50 text-sm">
          <div><strong>Domain:</strong> {result.root_domain}</div>
          <div><strong>URLs found:</strong> {result.scanned_urls}</div>
          <div><strong>Scan ID:</strong> {result.scan_run_id}</div>
        </div>
      )}

      {/* Classification Status */}
      {statusType !== "idle" && (
        <div className="mt-6">
          {statusType === "working" && (
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-black animate-pulse w-full" />
            </div>
          )}

          <div
            className={`mt-2 text-sm ${
              statusType === "done"
                ? "text-green-600"
                : statusType === "error"
                ? "text-red-600"
                : "text-gray-700"
            }`}
          >
            {statusText}
          </div>
        </div>
      )}
    </div>
  );
}
