"use client";

import { useState, useEffect } from "react";
import SendPasswordReset from "./components/SendPasswordReset";
import { supabase } from "@/lib/supabaseClient";



type CleanupResult = {
  pages_scanned: number;
  duplicate_pages_found: number;
  pages_deleted: number;
  dry_run: boolean;
};

type ShopifyPageResult = {
  id: string;
  title: string;
  handle: string;
  updatedAt?: string;
};

export default function Page() {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupPhase, setCleanupPhase] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  /* ======================================================
     LIVE MAP INTERVAL SETTINGS
  ====================================================== */

  const [humanMinutes, setHumanMinutes] = useState(360);
  const [crawlerSeconds, setCrawlerSeconds] = useState(300);

  const [intervalLoading, setIntervalLoading] = useState(true);
  const [intervalSaving, setIntervalSaving] = useState(false);
  const [intervalStatus, setIntervalStatus] = useState<string | null>(null);
  /* ======================================================
     CRAWLER LOGGING TOGGLE
  ====================================================== */

  const [crawlLoggingEnabled, setCrawlLoggingEnabled] = useState(false);
  const [crawlToggleLoading, setCrawlToggleLoading] = useState(true);
  const [crawlToggleSaving, setCrawlToggleSaving] = useState(false);
  const [crawlToggleStatus, setCrawlToggleStatus] = useState<string | null>(
    null
  );

  /* ======================================================
     LOAD LIVE MAP INTERVAL SETTINGS (STEP 3)
  ====================================================== */

  useEffect(() => {
    async function loadIntervals() {
      setIntervalLoading(true);

      const { data, error } = await supabase
        .from("map_interval_settings")
        .select("human_window_minutes, crawler_window_seconds")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
  console.error(error);
  setIntervalStatus("❌ Failed to load map interval settings");
} else if (data) {
  setHumanMinutes(data.human_window_minutes);
  setCrawlerSeconds(data.crawler_window_seconds);
}


      setIntervalLoading(false);
    }

    loadIntervals();
  }, []);
  /* ======================================================
     LOAD CRAWLER LOGGING TOGGLE
  ====================================================== */

  useEffect(() => {
    async function loadCrawlerToggle() {
      setCrawlToggleLoading(true);

      const { data, error } = await supabase
        .from("system_settings")
        .select("crawl_logging_enabled")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);
        setCrawlToggleStatus("❌ Failed to load crawler toggle");
      } else if (data) {
        setCrawlLoggingEnabled(data.crawl_logging_enabled);
      }

      setCrawlToggleLoading(false);
    }

    loadCrawlerToggle();
  }, []);

  /* ======================================================
     Shopify Page Finder Search Tool
  ====================================================== */

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ShopifyPageResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function runPageSearch() {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const res = await fetch("/api/shopify/search-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setSearchResults(data.pages || []);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  function openShopifyEditor(pageId: string) {
    const shopDomain = "doorplaceusa"; // <-- change if needed

    window.open(
      `https://admin.shopify.com/store/${shopDomain}/pages/${pageId}`,
      "_blank"
    );
  }
  /* ======================================================
     SAVE LIVE MAP INTERVAL SETTINGS (STEP 4)
  ====================================================== */

  async function saveIntervals() {
    setIntervalSaving(true);
    setIntervalStatus(null);

    const { error } = await supabase
      .from("map_interval_settings")
      .update({
        human_window_minutes: humanMinutes,
        crawler_window_seconds: crawlerSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
  console.error(error);
  setIntervalStatus("❌ Failed to save settings");
} else {
  setIntervalStatus("✅ Map intervals updated instantly");

  // ✅ FIX #5: Auto refresh so map updates immediately
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

setIntervalSaving(false);

  }
  /* ======================================================
     SAVE CRAWLER LOGGING TOGGLE
  ====================================================== */

  async function toggleCrawlerLogging(newValue: boolean) {
    setCrawlToggleSaving(true);
    setCrawlToggleStatus(null);

    setCrawlLoggingEnabled(newValue);

    const { error } = await supabase
      .from("system_settings")
      .update({
        crawl_logging_enabled: newValue,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
      setCrawlToggleStatus("❌ Failed to update crawler logging");
    } else {
      setCrawlToggleStatus(
        newValue
          ? "✅ Crawler logging is now ON"
          : "🚫 Crawler logging is now OFF (Google still crawls)"
      );
    }

    setCrawlToggleSaving(false);
  }

  /* ======================================================
     Shopify Sitemap Sync
  ====================================================== */

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
          headers: {
            "Content-Type": "application/json",

            // ✅ REQUIRED SECRET HEADER
            "x-sync-secret":
              process.env.NEXT_PUBLIC_SITEMAP_SYNC_SECRET || "",
          },
          body: JSON.stringify({ sitemapIndex, urlOffset }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();

        // ✅ Finished all sitemaps
        if (data.done) {
          setStatus("✅ Sitemap sync complete");
          break;
        }

        // Continue from returned offsets
        sitemapIndex = data.sitemapIndex;
        urlOffset = data.urlOffset;

        setStatus(
          `Syncing sitemap ${sitemapIndex + 1} of ${
            data.total_sitemaps
          }… (${data.upserted} URLs saved)`
        );
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  /* ======================================================
     Shopify Duplicate Cleanup
  ====================================================== */

  async function runDuplicateCleanup(dryRun: boolean) {
    if (cleanupRunning) return;

    setCleanupRunning(true);
    setCleanupPhase("running");
    setCleanupResult(null);
    setCleanupMessage(
      dryRun
        ? "🧪 Running duplicate scan (dry run)…"
        : "🧹 Deleting duplicate Shopify pages…"
    );

    try {
      const res = await fetch(
        `/api/shopify/cleanup-duplicate-titles${dryRun ? "?dry_run=1" : ""}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      setCleanupResult(data);
      setCleanupPhase("success");
      setCleanupMessage(
        dryRun
          ? "✅ Dry run complete — no pages deleted"
          : "🎉 Cleanup complete — duplicate pages removed"
      );
    } catch (err: any) {
      setCleanupPhase("error");
      setCleanupMessage(`❌ Error: ${err.message}`);
    } finally {
      setCleanupRunning(false);
    }
  }

  /* ======================================================
     PAGE UI
  ====================================================== */

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-6 max-w-375 w-full mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-3 text-gray-600">
          Manage system-level tools and administrative actions.
        </p>
      </div>

      {/* Password Reset */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Partner Password Tools</h2>
        <p className="text-sm text-gray-600 mb-4">
          Send a secure password reset link to a partner.
        </p>
        <SendPasswordReset />
      </div>
      {/* Live Map Interval Controls */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">
          Live Map Traffic Window Controls
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Control how far back the Live Map shows human visitors and crawler bot
          activity. These settings update instantly without editing SQL.
        </p>

        {intervalLoading ? (
          <p className="text-sm text-gray-500">
            Loading interval settings…
          </p>
        ) : (
          <div className="space-y-4">
            {/* Human Window */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Human Visitor Window (minutes)
              </label>

              <input
              type="number"
               min={1}
                  value={humanMinutes}
                 onChange={(e) =>
                          setHumanMinutes(Number(e.target.value))
                      }
                            className="w-full border rounded px-3 py-2 text-sm"
                        />


              <p className="text-xs text-gray-500 mt-1">
                Example: 360 = 6 hours, 60 = 1 hour
              </p>
            </div>

            {/* Crawler Window */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Crawler Activity Window (seconds)
              </label>

              <input
  type="number"
  min={5}
  value={crawlerSeconds}
  onChange={(e) =>
    setCrawlerSeconds(Number(e.target.value))
  }
  className="w-full border rounded px-3 py-2 text-sm"
/>


              <p className="text-xs text-gray-500 mt-1">
                Example: 300 = 5 minutes, 30 = last 30 seconds
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={saveIntervals}
              disabled={intervalSaving}
              className={`px-4 py-2 rounded font-medium text-sm transition ${
                intervalSaving
                  ? "bg-gray-300 text-gray-600"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {intervalSaving
                ? "Saving…"
                : "Save Map Interval Settings"}
            </button>

            {/* Status */}
            {intervalStatus && (
              <p className="text-sm mt-2 text-gray-700">
                {intervalStatus}
              </p>
            )}
          </div>
        )}
      </div>
      {/* Crawler Logging Toggle */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">
          Google Crawl Logging Control
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Google will continue crawling your pages normally. This switch only
          controls whether TradePilot logs crawler activity into Supabase.
        </p>

        {crawlToggleLoading ? (
          <p className="text-sm text-gray-500">Loading crawler setting…</p>
        ) : (
          <div className="flex items-center justify-between border rounded-md px-4 py-3 bg-white">
            <div>
              <p className="font-medium text-sm">Crawler Logging</p>
              <p className="text-xs text-gray-500">
                {crawlLoggingEnabled
                  ? "Logging crawler hits into database"
                  : "Crawler logging disabled (recommended during heavy crawl)"}
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              disabled={crawlToggleSaving}
              onClick={() => toggleCrawlerLogging(!crawlLoggingEnabled)}
              className={`w-14 h-8 flex items-center rounded-full px-1 transition ${
                crawlLoggingEnabled ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow transform transition ${
                  crawlLoggingEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {crawlToggleStatus && (
          <p className="text-sm mt-3 text-gray-700">{crawlToggleStatus}</p>
        )}
      </div>

      {/* Shopify Page Finder */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">
          Shopify Page Finder (TradePilot Search)
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Search Shopify pages instantly and open the real Shopify editor.
          Perfect for stores with thousands of pages.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search page title or handle..."
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button
            onClick={runPageSearch}
            disabled={searchLoading}
            className={`px-4 py-2 rounded font-medium text-sm transition ${
              searchLoading
                ? "bg-gray-300 text-gray-600"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {searchLoading ? "Searching…" : "Search"}
          </button>
        </div>

        {searchError && (
          <p className="text-sm text-red-600 mb-3">❌ {searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div className="border rounded-md bg-white overflow-hidden">
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
              >
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.handle}</p>
                </div>

                <button
                  onClick={() => openShopifyEditor(p.id)}
                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && !searchLoading && searchQuery && (
          <p className="text-sm text-gray-500">
            No pages found. Try another keyword.
          </p>
        )}
      </div>

      {/* Shopify Sitemap Sync */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">Shopify Sitemap Sync</h2>

        <p className="text-sm text-gray-600 mb-4">
          Sync all existing Shopify pages into TradePilot. Handles very large
          sitemaps (200k+ pages) safely.
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

        {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
      </div>

      {/* Duplicate Page Cleanup */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">
          Shopify Duplicate Page Cleanup
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Scans all Shopify pages and removes duplicate titles. Always run a dry
          test first.
        </p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => runDuplicateCleanup(true)}
            disabled={cleanupRunning}
            className={`px-4 py-2 rounded font-medium text-sm ${
              cleanupRunning
                ? "bg-gray-300 text-gray-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            🧪 Dry Run (Scan Only)
          </button>

          <button
            onClick={() => runDuplicateCleanup(false)}
            disabled={cleanupRunning}
            className={`px-4 py-2 rounded font-medium text-sm ${
              cleanupRunning
                ? "bg-gray-300 text-gray-600"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            🗑️ Delete Duplicates
          </button>
        </div>

        {/* Status Panel */}
        {cleanupPhase !== "idle" && (
          <div className="border rounded-md p-4 bg-gray-50 space-y-2">
            <div
              className={`h-2 w-full rounded ${
                cleanupPhase === "running"
                  ? "bg-blue-400 animate-pulse"
                  : cleanupPhase === "success"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />

            {cleanupMessage && (
              <p className="text-sm text-gray-800">{cleanupMessage}</p>
            )}

            {cleanupResult && (
              <div className="text-sm text-gray-700 space-y-1">
                <p>Pages scanned: {cleanupResult.pages_scanned}</p>
                <p>Duplicates found: {cleanupResult.duplicate_pages_found}</p>
                <p>Pages deleted: {cleanupResult.pages_deleted}</p>
                <p>
                  Mode:{" "}
                  {cleanupResult.dry_run
                    ? "Dry Run (no deletes)"
                    : "Live Delete"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-6 text-sm text-gray-500">
        More features coming soon.
      </div>
    </div>
  );
}
