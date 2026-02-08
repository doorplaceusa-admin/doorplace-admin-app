"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ✅ LIVE MAP COMPONENT */
import LiveUSMap from "@/app/components/LiveUSMap";

/* ===============================
   TYPES
================================ */

type PageRank = {
  page_url: string;
  total_views: number;
  last_viewed_at: string;
};

type LastView = {
  page_url: string;
  created_at: string;
};

type TimelinePoint = {
  minute: string;
  count: number;
};

const MAX_TIMELINE_POINTS = 60;

/* ===============================
   REFRESH SPEEDS (MAJOR IO FIX)
================================ */

// Live visitors refresh fast (map feels live)
const FAST_REFRESH = 15000; // 15 sec

// Rankings refresh slow (no reason to spam DB)
const SLOW_REFRESH = 10 * 60 * 1000; // 10 min

type SortKey = "views" | "last" | "url";

export default function AdminAnalyticsPage() {
  const [rankings, setRankings] = useState<PageRank[]>([]);
  const [lastView, setLastView] = useState<LastView | null>(null);

  /* ✅ LIVE VISITOR MAP DATA */
  const [liveVisitors, setLiveVisitors] = useState<any[]>([]);

  /* ✅ LIVE TIMELINE */
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const inflight = useRef(false);

  /* ============================================
     ✅ SLOW ANALYTICS LOAD (Top Pages + Last View)
     Runs only every 10 minutes
  ============================================ */
  async function loadSlowAnalytics() {
    if (inflight.current) return;
    inflight.current = true;

    try {
      const [{ data: rankingData, error: rankErr }, { data: lastData, error: lastErr }] =
        await Promise.all([
          supabase.from("analytics_page_rankings").select("*").limit(500),
          supabase.from("analytics_last_page_view").select("*").single(),
        ]);

      if (rankErr) console.error("Rankings error:", rankErr);
      if (lastErr) console.error("Last view error:", lastErr);

      if (rankingData) setRankings(rankingData);
      if (lastData) setLastView(lastData);
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }

  /* ============================================
     ✅ FAST LIVE MAP LOAD (SAFE QUERY)
     Runs every 15 seconds
     IMPORTANT: We do NOT order by created_at
     because the view may not have that column.
  ============================================ */
  async function loadFastLiveVisitors() {
    setMapError(null);

    const { data: liveData, error } = await supabase
      .from("live_map_visitors")
      .select("*")
      .limit(500);

    if (error) {
      console.error("Live map visitors error:", error);
      setMapError(error.message || "Live map query failed");
      setLiveVisitors([]);
      return;
    }

    setLiveVisitors(liveData || []);
    console.log("LIVE MAP ROW SAMPLE:", liveData?.[0]);
  }

  /* ===============================
     AUTO REFRESH SYSTEM (FIXED)
  ============================== */
  useEffect(() => {
    // Initial load
    loadSlowAnalytics();
    loadFastLiveVisitors();

    // Slow refresh (rankings)
    const slow = setInterval(loadSlowAnalytics, SLOW_REFRESH);

    // Fast refresh (map)
    const fast = setInterval(loadFastLiveVisitors, FAST_REFRESH);

    return () => {
      clearInterval(slow);
      clearInterval(fast);
    };
  }, []);

  /* ===============================
     REALTIME TIMELINE STREAM
  ============================== */
  useEffect(() => {
    const channel = supabase
      .channel("page-view-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "page_view_events" },
        () => addTimelinePoint()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function addTimelinePoint() {
    const now = new Date();
    const label = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setTimeline((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];

      if (last && last.minute === label) {
        last.count += 1;
        return [...copy];
      }

      copy.push({ minute: label, count: 1 });
      return copy.slice(-MAX_TIMELINE_POINTS);
    });
  }

  /* ===============================
     FILTER + SORT TOP PAGES
  ============================== */
  const filteredSortedRankings = useMemo(() => {
    const filtered = rankings.filter((r) =>
      r.page_url.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortKey === "views") {
        aVal = a.total_views;
        bVal = b.total_views;
      } else if (sortKey === "last") {
        aVal = new Date(a.last_viewed_at).getTime();
        bVal = new Date(b.last_viewed_at).getTime();
      } else {
        aVal = a.page_url.toLowerCase();
        bVal = b.page_url.toLowerCase();
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted.slice(0, 500);
  }, [rankings, search, sortKey, sortDir]);

  const maxLine = Math.max(...timeline.map((t) => t.count), 1);

  /* ===============================
     PAGE UI
  ============================== */

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-6 max-w-[1400px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full max-w-full overflow-x-hidden">
          <input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full md:max-w-xs"
          />

          <select
            className="border rounded px-3 py-2 text-sm w-full md:w-auto"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="views">Sort by Views</option>
            <option value="last">Sort by Last Viewed</option>
            <option value="url">Sort by URL</option>
          </select>

          <select
            className="border rounded px-3 py-2 text-sm w-full md:w-auto"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4 bg-white shadow">
          <h2 className="font-semibold mb-1">Last Page Viewed</h2>
          {lastView && (
            <>
              <div className="text-sm break-all">{lastView.page_url}</div>
              <div className="text-xs text-gray-500">
                {new Date(lastView.created_at).toLocaleString()}
              </div>
            </>
          )}
        </div>

        <div className="border rounded p-4 bg-white shadow md:col-span-2">
          <h2 className="font-semibold mb-3">Live Traffic (Last 60 min)</h2>
          <div className="flex items-end gap-1 h-40">
            {timeline.map((p, i) => (
              <div
                key={i}
                className="bg-blue-600 w-2 rounded-t"
                style={{ height: `${(p.count / maxLine) * 100}%` }}
                title={`${p.minute} – ${p.count}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ✅ LIVE VISITOR MAP */}
      <div className="border rounded p-4 bg-white shadow">
        <h2 className="font-semibold mb-3">
          Live Visitors by City (Last 5 Minutes)
        </h2>

        {mapError && (
          <div className="text-sm text-red-600 mb-3">
            Live Map Error: {mapError}
          </div>
        )}

        <LiveUSMap visitors={liveVisitors || []} />
      </div>

      {/* Top Pages */}
      <div className="border rounded p-4 bg-white shadow">
        <h2 className="font-semibold mb-2">Top Pages</h2>
        {loading && <div className="text-sm text-gray-500">Loading…</div>}

        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b hidden md:table-header-group">
              <tr>
                <th className="text-left py-2">Page URL</th>
                <th className="text-right py-2">Views</th>
                <th className="text-right py-2">Last Viewed</th>
              </tr>
            </thead>

            <tbody>
              {filteredSortedRankings.map((r) => (
                <tr
                  key={r.page_url}
                  className="border-b hover:bg-gray-50 block md:table-row p-2 md:p-0"
                >
                  <td className="block md:table-cell py-1 md:py-2">
                    <div className="font-mono text-xs break-all whitespace-normal">
                      {r.page_url}
                    </div>
                  </td>

                  <td className="block md:table-cell py-1 md:py-2 text-right font-medium">
                    {r.total_views.toLocaleString()}
                  </td>

                  <td className="block md:table-cell py-1 md:py-2 text-right">
                    {new Date(r.last_viewed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
