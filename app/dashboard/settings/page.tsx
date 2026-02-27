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

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <div className="text-sm text-gray-600">{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

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
  const [crawlToggleStatus, setCrawlToggleStatus] = useState<string | null>(null);

  /* ======================================================
     SITEMAP SYNC JOB STATE
  ====================================================== */

  const [job, setJob] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobActionLoading, setJobActionLoading] = useState(false);
  const [pollingSpeed, setPollingSpeed] = useState<
  "initializing" | "fast" | "slow"
>("initializing");

/* ======================================================
   SITEMAP REBUILD STATE
====================================================== */

const [rebuildJob, setRebuildJob] = useState<any>(null);
const [rebuildLoading, setRebuildLoading] = useState(false);
const [rebuildActionLoading, setRebuildActionLoading] = useState(false);


/* ======================================================
   INCREMENTAL SITEMAP STATE
====================================================== */

const [incrementalRunning, setIncrementalRunning] = useState(false);
const [incrementalStatus, setIncrementalStatus] = useState<string | null>(null);
const [incrementalResult, setIncrementalResult] = useState<string | null>(null);
const [incrementalStartedAt, setIncrementalStartedAt] = useState<string | null>(null);
const [incrementalFinishedAt, setIncrementalFinishedAt] = useState<string | null>(null);
const [latestChunkNumber, setLatestChunkNumber] = useState<number | null>(null);
  /* ======================================================
     LOAD LIVE MAP INTERVAL SETTINGS
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
     LOAD SITEMAP JOB STATUS (UPGRADED: dynamic polling)
  ====================================================== */

  useEffect(() => {
  let interval: any = null;

  async function loadJob() {
    try {
      const res = await fetch("/api/shopify/sync-sitemap/status");
      const data = await res.json();

      if (data.success) {
        setJob(data.job);

        if (data.job?.status === "running") {
          setPollingSpeed("fast");
          restartInterval(2000);
        } else {
          setPollingSpeed("slow");
          restartInterval(10000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJobLoading(false);
    }
  }




  function restartInterval(ms: number) {
    if (interval) clearInterval(interval);
    interval = setInterval(loadJob, ms);
  }

  setPollingSpeed("initializing"); // ✅ add this
  loadJob();
  restartInterval(5000);

  return () => {
    if (interval) clearInterval(interval);
  };
}, []);
/* ======================================================
   LOAD SITEMAP REBUILD STATUS
====================================================== */

useEffect(() => {
  let interval: any = null;

  async function loadRebuildStatus() {
    try {
      const res = await fetch("/api/rebuild-sitemap/status");
      const data = await res.json();

      if (data.success) {
        setRebuildJob(data.job);

        // ✅ NEW: auto-detect latest chunk number
        if (typeof data.job?.final_chunk_number === "number") {
          setLatestChunkNumber(data.job.final_chunk_number);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRebuildLoading(false);
    }
  }

  loadRebuildStatus();
  interval = setInterval(loadRebuildStatus, 3000);

  return () => {
    if (interval) clearInterval(interval);
  };
}, []);


  // ✅ helper: force refresh immediately after actions
  async function refreshJob() {
    try {
      const res = await fetch("/api/shopify/sync-sitemap/status");
      const data = await res.json();
      if (data.success) setJob(data.job);
    } catch (err) {
      console.error(err);
    }
  }

  /* ======================================================
     SAVE LIVE MAP INTERVAL SETTINGS
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

      // ✅ KEEP RELOAD (per your request)
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

    const { error } = await supabase.from("system_settings").update({
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
     Shopify Duplicate Cleanup
  ====================================================== */

  async function runDuplicateCleanup(dryRun: boolean) {
    if (cleanupRunning) return;

    setCleanupRunning(true);
    setCleanupPhase("running");
    setCleanupResult(null);
    setCleanupMessage(
      dryRun ? "🧪 Running duplicate scan (dry run)…" : "🧹 Deleting duplicate Shopify pages…"
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
        dryRun ? "✅ Dry run complete — no pages deleted" : "🎉 Cleanup complete — duplicate pages removed"
      );
    } catch (err: any) {
      setCleanupPhase("error");
      setCleanupMessage(`❌ Error: ${err.message}`);
    } finally {
      setCleanupRunning(false);
    }
  }

  /* ======================================================
     SITEMAP JOB ACTIONS (UPGRADED: immediate refresh)
  ====================================================== */

  async function startSitemapSync() {
    if (jobActionLoading) return;

    setJobActionLoading(true);

    try {
      const res = await fetch("/api/shopify/sync-sitemap/start", {
        method: "POST",
        headers: {
          "x-sync-secret": process.env.NEXT_PUBLIC_SITEMAP_SYNC_SECRET || "",
        },
      });

      if (!res.ok) throw new Error(await res.text());

      // ✅ refresh immediately
      await refreshJob();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJobActionLoading(false);
    }
  }

  async function cancelSitemapSync() {
    if (jobActionLoading) return;

    setJobActionLoading(true);

    try {
      const res = await fetch("/api/shopify/sync-sitemap/cancel", {
        method: "POST",
        headers: {
          "x-sync-secret": process.env.NEXT_PUBLIC_SITEMAP_SYNC_SECRET || "",
        },
      });

      if (!res.ok) throw new Error(await res.text());

      // ✅ refresh immediately
      await refreshJob();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJobActionLoading(false);
    }
  }

  async function resumeSitemapSync() {
    if (jobActionLoading) return;

    setJobActionLoading(true);

    try {
      const res = await fetch("/api/shopify/sync-sitemap/resume", {
        method: "POST",
        headers: {
          "x-sync-secret": process.env.NEXT_PUBLIC_SITEMAP_SYNC_SECRET || "",
        },
      });

      if (!res.ok) throw new Error(await res.text());

      // ✅ refresh immediately
      await refreshJob();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJobActionLoading(false);
    }
  }
async function startRebuild() {
  if (rebuildActionLoading) return;

  setRebuildActionLoading(true);

  try {
    const res = await fetch("/api/rebuild-sitemap/start", {
      method: "POST",
    });

    if (!res.ok) {
      const text = await res.text();
      alert(text);
    }
  } catch (err: any) {
    alert(err.message);
  } finally {
    setRebuildActionLoading(false);
  }
}
 
function openSitemapIndex() {
  window.open("https://tradepilot.doorplaceusa.com/sitemap.xml", "_blank");
}

function openSitemapChunk(n: number) {
  window.open(`https://tradepilot.doorplaceusa.com/sitemap${n}.xml`, "_blank");
}

async function runIncrementalSitemap() {
  if (incrementalRunning) return;

  setIncrementalRunning(true);
  setIncrementalStatus("running");
  setIncrementalResult(null);

  const started = new Date().toISOString();
  setIncrementalStartedAt(started);
  setIncrementalFinishedAt(null);

  try {
    const res = await fetch("/api/rebuild-sitemap/incremental", {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      setIncrementalStatus("error");
      setIncrementalResult(text || "Incremental run failed.");
      return;
    }

    setIncrementalStatus("completed");
    setIncrementalResult(text || "Incremental run complete.");
    // ✅ Force refresh rebuild status so latest chunk updates immediately
try {
  const statusRes = await fetch("/api/rebuild-sitemap/status", { cache: "no-store" });
  const statusData = await statusRes.json();
  if (statusData.success && typeof statusData.job?.final_chunk_number === "number") {
    setLatestChunkNumber(statusData.job.final_chunk_number);
    setRebuildJob(statusData.job);
  }
} catch (e) {
  // ignore refresh errors
}
  } catch (err: any) {
    setIncrementalStatus("error");
    setIncrementalResult(err?.message || "Incremental run failed.");
  } finally {
    setIncrementalRunning(false);
    setIncrementalFinishedAt(new Date().toISOString());
  }
}

/* ======================================================
     PAGE UI
  ====================================================== */

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-10 space-y-6 max-w-375 w-full mx-auto bg-gray-50 px-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-3 text-gray-600">
          Manage system-level tools and administrative actions.
        </p>
      </div>

      <SectionCard
  title="Partner Password Tools"
  description="Send a secure password reset link to a partner."
>
  <SendPasswordReset />
</SectionCard>

      {/* Live Map Interval Controls */}
<SectionCard
  title="Live Map Traffic Window Controls"
  description={
    <>
      Control how far back the Live Map shows human visitors and crawler bot
      activity. These settings update instantly without editing SQL.
    </>
  }
>
        <h2 className="text-lg font-semibold mb-2">Live Map Traffic Window Controls</h2>

        <p className="text-sm text-gray-600 mb-4">
          Control how far back the Live Map shows human visitors and crawler bot
          activity. These settings update instantly without editing SQL.
        </p>

        {intervalLoading ? (
          <p className="text-sm text-gray-500">Loading interval settings…</p>
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
                onChange={(e) => setHumanMinutes(Number(e.target.value))}
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
                onChange={(e) => setCrawlerSeconds(Number(e.target.value))}
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
              {intervalSaving ? "Saving…" : "Save Map Interval Settings"}
            </button>

            {/* Status */}
            {intervalStatus && (
              <p className="text-sm mt-2 text-gray-700">{intervalStatus}</p>
            )}
          </div>
        )}
</SectionCard>


      {/* Crawler Logging Toggle */}
<SectionCard
  title="Google Crawl Logging Control"
  description={
    <>
      Google will continue crawling your pages normally. This switch only controls
      whether TradePilot logs crawler activity into Supabase.
    </>
  }
>
        <h2 className="text-lg font-semibold mb-2">Google Crawl Logging Control</h2>

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
      </SectionCard>



      {/* Shopify Page Finder */}
<SectionCard
  title="Shopify Page Finder (TradePilot Search)"
  description={
    <>
      Search Shopify pages instantly and open the real Shopify editor. Perfect
      for stores with thousands of pages.
    </>
  }
>
        <h2 className="text-lg font-semibold mb-2">Shopify Page Finder (TradePilot Search)</h2>

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
          <p className="text-sm text-gray-500">No pages found. Try another keyword.</p>
        )}
</SectionCard>


      {/* Shopify Sitemap Sync */}
<SectionCard
  title="Shopify Sitemap Sync"
  description={
    <>
      Background job that syncs Shopify sitemap into TradePilot. Progress
      persists across refresh and devices.
    </>
  }
>
        <h2 className="text-lg font-semibold mb-2">Shopify Sitemap Sync</h2>

        <p className="text-sm text-gray-600 mb-4">
          Background job that syncs Shopify sitemap into TradePilot. Progress
          persists across refresh and devices.
        </p>

        {jobLoading ? (
          <p className="text-sm text-gray-500">Loading job status…</p>
        ) : (
          <>
            {/* Status Panel */}
            {job && (
              <div className="border rounded-md p-4 bg-gray-50 space-y-2 mb-4">
                <div
                  className={`h-2 w-full rounded ${
                    job.status === "running"
                      ? "bg-blue-500 animate-pulse"
                      : job.status === "completed"
                      ? "bg-green-500"
                      : job.status === "failed"
                      ? "bg-red-500"
                      : job.status === "canceled"
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                  }`}
                />

                <p className="text-sm">
                  <strong>Status:</strong> {job.status}
                </p>
<p className="text-xs text-gray-500">
  <strong>Polling:</strong>{" "}
  {pollingSpeed === "fast" && (
    <span className="text-blue-600">Fast (2s)</span>
  )}
  {pollingSpeed === "slow" && (
    <span className="text-gray-600">Slow (10s)</span>
  )}
  {pollingSpeed === "initializing" && (
    <span className="text-gray-400">Initializing…</span>
  )}
</p>
                <p className="text-sm">
                  <strong>Progress:</strong>{" "}
                  {job.total_sitemaps
                    ? `${Math.min(job.sitemap_index, job.total_sitemaps)} / ${job.total_sitemaps} sitemaps`
                    : `${job.sitemap_index}`}
                </p>

                <p className="text-sm">
                  <strong>URLs Processed:</strong>{" "}
                  {job.total_urls_processed?.toLocaleString()}
                </p>

                {job.current_sitemap_url && (
                  <p className="text-xs text-gray-600 break-all">
                    <strong>Current:</strong> {job.current_sitemap_url}
                  </p>
                )}

                {job.last_error && (
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {job.last_error}
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              {/* Start */}
              <button
                onClick={startSitemapSync}
                disabled={jobActionLoading || job?.status === "running"}
                className="px-4 py-2 rounded bg-black text-white text-sm disabled:bg-gray-300"
              >
                Start
              </button>

              {/* Cancel */}
              <button
                onClick={cancelSitemapSync}
                disabled={jobActionLoading || job?.status !== "running"}
                className="px-4 py-2 rounded bg-yellow-600 text-white text-sm disabled:bg-gray-300"
              >
                Cancel
              </button>

              {/* Resume */}
              <button
                onClick={resumeSitemapSync}
                disabled={
                  jobActionLoading ||
                  !["canceled", "failed"].includes(job?.status)
                }
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:bg-gray-300"
              >
                Resume
              </button>
            </div>
          </>
        )}
</SectionCard>


{/* Sitemap Rebuild */}
<SectionCard
  title="Sitemap Rebuild"
  description="Rebuilds the sitemap_chunks table from shopify_url_inventory."
>
  <h2 className="text-lg font-semibold mb-2">Sitemap Rebuild</h2>

  <p className="text-sm text-gray-600 mb-4">
    Rebuilds the sitemap_chunks table from shopify_url_inventory.
  </p>

  {rebuildLoading ? (
    <p className="text-sm text-gray-500">Loading rebuild status…</p>
  ) : (
    <>
      {rebuildJob && (
        <div className="border rounded-md p-4 bg-gray-50 space-y-2 mb-4">
          <div
            className={`h-2 w-full rounded ${
              rebuildJob.status === "running"
                ? "bg-blue-500 animate-pulse"
                : rebuildJob.status === "completed"
                ? "bg-green-500"
                : rebuildJob.status === "failed"
                ? "bg-red-500"
                : "bg-gray-300"
            }`}
          />

          <p className="text-sm">
            <strong>Status:</strong>{" "}
            {rebuildJob.status || "idle"}
          </p>

          <p className="text-sm">
            <strong>Rows Processed:</strong>{" "}
            {rebuildJob.rows_processed?.toLocaleString() || 0}
          </p>
        </div>
      )}

      <button
  onClick={startRebuild}
  disabled={
    rebuildActionLoading ||
    rebuildLoading ||
    rebuildJob?.status === "running"
  }
  className="px-4 py-2 rounded bg-black text-white text-sm disabled:bg-gray-300"
>
  {rebuildActionLoading
    ? "Starting…"
    : rebuildJob?.status === "running"
    ? "Rebuilding…"
    : "Rebuild Sitemap"}
</button>
    </>
  )}
</SectionCard>




{/* Incremental Sitemap Update (SAFE) */}
<SectionCard
  title="Incremental Sitemap Update (SAFE)"
  description={
    <>
      Appends only NEW URLs into sitemap_chunks without reshuffling existing
      chunks. Use this after syncing new Shopify pages into{" "}
      <code>shopify_url_inventory</code>.
    </>
  }
>
  <h2 className="text-lg font-semibold mb-2">Incremental Sitemap Update (SAFE)</h2>

  <p className="text-sm text-gray-600 mb-4">
    Appends only NEW URLs into sitemap_chunks without reshuffling existing chunks.
    Use this after syncing new Shopify pages into <code>shopify_url_inventory</code>.
  </p>

  <div className="flex flex-wrap gap-3 mb-4">
    <button
      onClick={runIncrementalSitemap}
      disabled={incrementalRunning}
      className="px-4 py-2 rounded bg-black text-white text-sm disabled:bg-gray-300"
    >
      {incrementalRunning ? "Running Incremental…" : "Run Incremental Update"}
    </button>

    <button
      onClick={openSitemapIndex}
      className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800"
    >
      Open sitemap.xml
    </button>

   
   <button
  onClick={() => {
    if (latestChunkNumber !== null) openSitemapChunk(latestChunkNumber);
  }}
  disabled={latestChunkNumber === null}
  className={`px-4 py-2 rounded text-sm ${
    latestChunkNumber === null
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
  }`}
>
  {latestChunkNumber === null
    ? "Loading latest chunk…"
    : `Open latest chunk (${latestChunkNumber})`}
</button>
  </div>

  <div className="border rounded-md p-4 bg-gray-50 space-y-2">
    <div
      className={`h-2 w-full rounded ${
        incrementalStatus === "running"
          ? "bg-blue-500 animate-pulse"
          : incrementalStatus === "completed"
          ? "bg-green-500"
          : incrementalStatus === "error"
          ? "bg-red-500"
          : "bg-gray-300"
      }`}
    />

    <p className="text-sm">
      <strong>Status:</strong> {incrementalStatus || "idle"}
    </p>

    {incrementalStartedAt && (
      <p className="text-xs text-gray-600">
        <strong>Started:</strong> {incrementalStartedAt}
      </p>
    )}

    {incrementalFinishedAt && (
      <p className="text-xs text-gray-600">
        <strong>Finished:</strong> {incrementalFinishedAt}
      </p>
    )}

    {incrementalResult && (
      <pre className="text-xs bg-white border rounded p-3 overflow-x-auto whitespace-pre-wrap">
        {incrementalResult}
      </pre>
    )}
  </div>

  <p className="text-xs text-gray-500 mt-3">
    Note: This runs in the foreground. Leave this page open until it finishes.
  </p>
</SectionCard>




      {/* Duplicate Page Cleanup */}
<SectionCard
  title="Shopify Duplicate Page Cleanup"
  description={
    <>
      Scans all Shopify pages and removes duplicate titles. Always run a dry
      test first.
    </>
  }
>
        <h2 className="text-lg font-semibold mb-2">Shopify Duplicate Page Cleanup</h2>

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
                  {cleanupResult.dry_run ? "Dry Run (no deletes)" : "Live Delete"}
                </p>
              </div>
            )}
          </div>
        )}
</SectionCard>


      {/* Footer */}
      <div className="text-xs text-gray-500 text-center py-2">
  More features coming soon.
</div>
    </div>
  );
}