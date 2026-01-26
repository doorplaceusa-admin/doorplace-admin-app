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

export default function IPlumPage() {
  const [events, setEvents] = useState<IPlumEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/iplum")
      .then(res => res.json())
      .then(data => {
        console.log("📞 iPlum API:", data);

        if (!data?.ok) {
          throw new Error("API returned error");
        }

        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load iPlum data");
        setLoading(false);
      });
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-[1500px] w-full mx-auto">
      <h1 className="text-2xl font-bold">📞 iPlum Dashboard</h1>

      {loading && <p>Loading calls & messages…</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && events.length === 0 && (
        <p className="text-gray-500">
          No iPlum activity yet. Make a call or send a text to test.
        </p>
      )}

      <div className="space-y-3">
        {events.map(e => (
          <div
            key={e.id}
            className="border rounded p-3 bg-white shadow-sm"
          >
            <div className="text-sm text-gray-600">
              {new Date(e.created_at).toLocaleString()}
            </div>

            <div className="font-semibold">
              {e.event_type} {e.direction && `(${e.direction})`}
            </div>

            <div className="text-sm">
              {e.from_number} → {e.to_number}
            </div>

            {e.message && (
              <div className="mt-1 text-gray-700 italic">
                “{e.message}”
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
