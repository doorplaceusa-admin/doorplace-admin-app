"use client";

import { useEffect, useState } from "react";

type IPlumEvent = {
  id: string;
  event_type: string;
  direction: string | null;
  from_number: string | null;
  to_number: string | null;
  message: string | null;
  created_at: string;
};

/* ---------- helpers ---------- */

function getEventKind(eventType: string) {
  if (eventType.startsWith("sms")) return "SMS";
  return "CALL";
}

function formatDirection(direction: string | null) {
  if (!direction) return "";
  if (direction === "in" || direction === "inbound") return "Incoming";
  if (direction === "out" || direction === "outbound") return "Outgoing";
  return direction;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ---------- page ---------- */

export default function IPlumPage() {
  const [events, setEvents] = useState<IPlumEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/iplum")
      .then(res => res.json())
      .then(data => {
        if (!data?.ok) throw new Error("API error");
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load iPlum data");
        setLoading(false);
      });
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-10 max-w-[1400px] w-full mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-6 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📞 iPlum Activity
        </h1>
        <span className="text-sm text-gray-500">
          Live call & SMS history
        </span>
      </div>

      {/* States */}
      {loading && (
        <p className="mt-6 text-gray-500">Loading calls & messages…</p>
      )}

      {error && (
        <p className="mt-6 text-red-600">{error}</p>
      )}

      {!loading && events.length === 0 && (
        <p className="mt-6 text-gray-500">
          No iPlum activity yet.
        </p>
      )}

      {/* Event list */}
      <div className="mt-6 space-y-4">
        {events.map(e => {
          const kind = getEventKind(e.event_type);
          const dir = formatDirection(e.direction);

          return (
            <div
              key={e.id}
              className="border rounded-lg bg-white shadow-sm p-4"
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      kind === "SMS"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {kind}
                  </span>

                  {dir && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {dir}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {formatTime(e.created_at)}
                </div>
              </div>

              {/* Numbers */}
              <div className="mt-2 text-sm">
                <span className="font-medium">
                  {e.from_number || "Unknown"}
                </span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="font-medium">
                  {e.to_number || "Unknown"}
                </span>
              </div>

              {/* Message */}
              {e.message && (
                <div className="mt-2 text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3">
                  “{e.message}”
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
