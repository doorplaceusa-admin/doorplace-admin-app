"use client";

import { useState } from "react";
import SendPasswordReset from "./components/SendPasswordReset";

export default function Page() {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function runSitemapSync() {
    if (syncing) return;

    setSyncing(true);
    setStatus("Starting sitemap sync…");

    let sitemapIndex = 0;
    let urlOffset = 0;
    let done = false;

    try {
      while (!done) {
        const res = await fetch("/api/shopify/sync-sitemap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sitemapIndex,
            urlOffset,
          }),
        });

        if (!res.ok) {
  const text = await res.text();
  throw new Error(text);
}

        const data = await res.json();

        if (data.done) {
          done = true;
          setStatus("✅ Sitemap sync complete");
          break;
        }

        sitemapIndex = data.sitemapIndex;
        urlOffset = data.urlOffset;

        setStatus(
          `Syncing sitemap ${sitemapIndex + 1} of ${data.total_sitemaps}…`
        );
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-6 max-w-[1500px] w-full mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-3 text-gray-600">
          Manage system-level tools and administrative actions.
        </p>
      </div>

      {/* Password Reset Tool */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Partner Password Tools
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Send a secure password reset link to a partner.
        </p>

        <SendPasswordReset />
      </div>

      {/* Shopify Sitemap Sync */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">
          Shopify Sitemap Sync
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Sync all existing Shopify pages into TradePilot.  
          Handles very large sitemaps (200k+ pages) safely.
        </p>

        <button
          onClick={runSitemapSync}
          disabled={syncing}
          className={`px-4 py-2 rounded font-medium text-sm transition ${
            syncing
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {syncing ? "Syncing Sitemap…" : "Sync Shopify Sitemap"}
        </button>

        {status && (
          <p className="mt-3 text-sm text-gray-700">
            {status}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-6 text-sm text-gray-500">
        More features coming soon.
      </div>
    </div>
  );
}
