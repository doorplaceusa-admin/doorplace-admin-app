"use client";

import { useEffect, useState } from "react";

export default function IncomingCallPopup() {
  const [lastCallId, setLastCallId] = useState<string | null>(null);
  const [call, setCall] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/iplum");
        const data = await res.json();

        if (!data?.events?.length) return;

        const latest = data.events[0];

        // Only trigger on NEW call
        if (latest.id !== lastCallId) {
          setLastCallId(latest.id);
          setCall(latest);

          // auto-hide after 6 sec
          setTimeout(() => setCall(null), 6000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000); // every 4 seconds

    return () => clearInterval(interval);
  }, [lastCallId]);

  if (!call) return null;

  const name =
    call.lead?.first_name ||
    call.invoice?.customer_name ||
    "Unknown Caller";

  const phone = call.cleaned_phone || "Unknown";
  const type = call.match_type || "unknown";

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white shadow-xl rounded-2xl p-4 w-80 border">
      <div className="text-sm text-gray-500 mb-1">
        📞 Incoming Call
      </div>

      <div className="text-lg font-semibold">
        {name}
      </div>

      <div className="text-gray-600 text-sm">
        {phone}
      </div>

      <div className="mt-2 text-xs">
        <span
          className={`px-2 py-1 rounded-full ${
            type === "lead"
              ? "bg-green-100 text-green-700"
              : type === "invoice"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {type.toUpperCase()}
        </span>
      </div>
    </div>
  );
}