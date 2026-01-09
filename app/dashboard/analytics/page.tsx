"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PageRank = {
  page_url: string;
  total_views: number;
  last_viewed_at: string;
};

type LastView = {
  page_url: string;
  created_at: string;
};

type HeatmapRow = {
  hour_of_day: number;
  total_views: number;
};

type TimelinePoint = {
  minute: string;
  count: number;
};

export default function AdminAnalyticsPage() {
  const [rankings, setRankings] = useState<PageRank[]>([]);
  const [lastView, setLastView] = useState<LastView | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [{ data: rankingData }, { data: lastData }, { data: heatData }] =
      await Promise.all([
        supabase.from("analytics_page_rankings").select("*"),
        supabase
          .from("analytics_last_page_view")
          .select("*")
          .single(),
        supabase.from("analytics_hourly_heatmap").select("*"),
      ]);

    if (rankingData) setRankings(rankingData);
    if (lastData) setLastView(lastData);
    if (heatData) setHeatmap(heatData);
  }

  // realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("page-view-events-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "page_view_events",
        },
        async () => {
          await loadAll();
          addTimelinePoint();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // timeline logic (last 30 minutes)
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
      return copy.slice(-30);
    });
  }

  const maxHeat = Math.max(...heatmap.map((h) => h.total_views), 1);
  const maxLine = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-[1000px] w-full mx-auto">
      <h1 className="text-2xl font-bold">Page Analytics</h1>

      {/* Last Page Viewed */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-1">Last Page Viewed</h2>
        {lastView && (
          <>
            <div className="text-sm">{lastView.page_url}</div>
            <div className="text-xs text-gray-500">
              {new Date(lastView.created_at).toLocaleString()}
            </div>
          </>
        )}
      </div>

      {/* Live Graph */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Live Page Views</h2>
        <div className="flex items-end gap-1 h-32">
          {timeline.map((p, i) => (
            <div
              key={i}
              className="bg-blue-600 w-3"
              style={{
                height: `${(p.count / maxLine) * 100}%`,
              }}
              title={`${p.minute} – ${p.count}`}
            />
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Hourly Heatmap</h2>
        <div className="grid grid-cols-12 gap-2 text-xs">
          {Array.from({ length: 24 }).map((_, hour) => {
            const row = heatmap.find((h) => h.hour_of_day === hour);
            const count = row?.total_views ?? 0;
            const intensity = count / maxHeat;

            return (
              <div
                key={hour}
                className="h-12 flex items-center justify-center rounded text-white"
                style={{
                  backgroundColor: `rgba(220,38,38,${Math.max(
                    intensity,
                    0.05
                  )})`,
                }}
                title={`${hour}:00 – ${count} views`}
              >
                {hour}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rankings */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Top Pages</h2>
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Page URL</th>
              <th className="text-right py-1">Views</th>
              <th className="text-right py-1">Last Viewed</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r) => (
              <tr key={r.page_url} className="border-b">
                <td className="py-1">{r.page_url}</td>
                <td className="py-1 text-right">{r.total_views}</td>
                <td className="py-1 text-right">
                  {new Date(r.last_viewed_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
