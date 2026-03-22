"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function IncomingCallPopup() {
  const [lastCallId, setLastCallId] = useState<string | null>(null);
  const [call, setCall] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/iplum");
        const data = await res.json();

        if (!data?.events?.length) return;

        const latest = data.events[0];

        if (latest.id !== lastCallId) {
          setLastCallId(latest.id);
          setCall(latest);

          // 🔊 PLAY SOUND
          new Audio("/ding.mp3").play().catch(() => {});

          // auto hide
          setTimeout(() => setCall(null), 7000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [lastCallId]);

  if (!call) return null;

  const name =
    call.lead?.first_name ||
    call.invoice?.customer_name ||
    "Unknown Caller";

  const phone = call.cleaned_phone || "Unknown";
  const type = call.match_type || "unknown";

  const revenue =
    call.invoice?.total ||
    call.invoice?.amount ||
    null;

  const handleClick = () => {
    if (call.lead?.id) {
      router.push(`/dashboard/leads?id=${call.lead.id}`);
    } else if (call.invoice?.id) {
      router.push(`/dashboard/invoices?id=${call.invoice.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-999 w-80 bg-white rounded-2xl shadow-2xl border p-4 cursor-pointer animate-slide-in"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          📞 Incoming Call
        </span>

        <span
          className={`text-[10px] px-2 py-1 rounded-full ${
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

      <div className="text-lg font-semibold">
        {name}
      </div>

      <div className="text-sm text-gray-600">
        {phone}
      </div>

      {revenue && (
        <div className="mt-2 text-sm font-medium text-green-600">
          💰 ${revenue}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        Click to open
      </div>
    </div>
  );
}