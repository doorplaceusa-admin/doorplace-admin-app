// app/dashboard/email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   SEGMENT LOGIC (MATCHES PARTNERS PAGE)
================================ */

type SegmentKey =
  | "all"
  | "login_users"
  | "no_login"
  | "email_not_verified"
  | "ready_for_activation"
  | "welcome_email_not_sent_login"
  | "pending"
  | "active";

function applyPartnerSegment(query: any, segment: SegmentKey) {
  switch (segment) {
    case "login_users":
      return query.not("auth_user_id", "is", null);

    case "no_login":
      return query.is("auth_user_id", null);

    case "email_not_verified":
      return query.eq("email_verified", false);

    case "pending":
      return query.eq("status", "pending");

    case "active":
      return query.eq("status", "active");

    case "ready_for_activation":
      return query
        .not("auth_user_id", "is", null)
        .eq("email_verified", true)
        .eq("status", "pending");

    case "welcome_email_not_sent_login":
      return query
        .not("auth_user_id", "is", null)
        .eq("status", "pending")
        .eq("welcome_email_sent", false);

    case "all":
    default:
      return query;
  }
}

export default function EmailDashboardPage() {
  const [mode, setMode] = useState<"manual" | "segment">("segment");
  const [segment, setSegment] = useState<SegmentKey>("all");

  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});
  const [manualEmails, setManualEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [delayMs, setDelayMs] = useState(2000);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  async function loadCounts() {
    const segments: SegmentKey[] = [
      "all",
      "login_users",
      "no_login",
      "email_not_verified",
      "ready_for_activation",
      "welcome_email_not_sent_login",
      "pending",
      "active",
    ];

    const results: Record<string, number> = {};

    for (const s of segments) {
      let q = supabase.from("partners").select("*", { count: "exact", head: true });
      q = applyPartnerSegment(q, s);

      const { count, error } = await q;
      if (error) {
        results[s] = 0;
      } else {
        results[s] = count || 0;
      }
    }

    setSegmentCounts(results);
  }

  useEffect(() => {
    loadCounts();
  }, []);

  async function sendEmail() {
    if (!subject.trim() || !body.trim()) {
      alert("Subject and body are required.");
      return;
    }

    if (mode === "manual") {
      const list = manualEmails
        .split(/[,;\s]+/g)
        .map((e) => e.trim())
        .filter(Boolean);
      if (list.length === 0) {
        alert("Enter at least one email.");
        return;
      }
    }

    setSending(true);
    setLastResult(null);

    try {
      const payload =
        mode === "manual"
          ? {
              mode: "manual",
              to: manualEmails,
              subject,
              html: body,
              delayMs,
            }
          : {
              mode: "segment",
              segment,
              subject,
              html: body,
              delayMs,
            };

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLastResult(data);

      if (!res.ok) {
        console.error("Email send failed:", data);
        alert(data?.error || "Email failed. Check server logs.");
        return;
      }

      if (mode === "manual") {
        alert(`Done. Sent: ${data.sent} / ${data.count}. Failed: ${data.failed}.`);
      } else {
        alert(
          `Done (${segment}). Sent: ${data.sent} / ${data.count}. Failed: ${data.failed}.`
        );
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("Unexpected error sending email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-[1500px] w-full mx-auto">
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <h1 className="text-3xl font-bold text-red-700">Email</h1>
        <p className="text-sm text-gray-500">TradePilot — Partner Email System</p>
      </div>

      {/* MODE */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-sm rounded border ${
              mode === "segment" ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setMode("segment")}
            type="button"
          >
            Segment
          </button>

          <button
            className={`px-3 py-1 text-sm rounded border ${
              mode === "manual" ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setMode("manual")}
            type="button"
          >
            Manual
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Delay</span>
          <input
            className="border rounded px-2 py-1 w-[110px] text-sm"
            type="number"
            min={0}
            step={250}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value || 0))}
          />
          <span className="text-xs text-gray-500">ms</span>
        </div>
      </div>

      {/* RECIPIENTS */}
      {mode === "segment" ? (
        <select
          className="border rounded px-3 py-2 w-full max-w-md"
          value={segment}
          onChange={(e) => setSegment(e.target.value as SegmentKey)}
        >
          <option value="all">All Partners ({segmentCounts.all || 0})</option>
          <option value="login_users">Login Users ({segmentCounts.login_users || 0})</option>
          <option value="no_login">No Login Yet ({segmentCounts.no_login || 0})</option>
          <option value="email_not_verified">
            Email Not Verified ({segmentCounts.email_not_verified || 0})
          </option>
          <option value="ready_for_activation">
            Ready for Activation ({segmentCounts.ready_for_activation || 0})
          </option>
          <option value="welcome_email_not_sent_login">
            Welcome Email Not Sent (Login Users) ({segmentCounts.welcome_email_not_sent_login || 0})
          </option>
          <option value="pending">Pending ({segmentCounts.pending || 0})</option>
          <option value="active">Active ({segmentCounts.active || 0})</option>
        </select>
      ) : (
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Emails (comma, space, or new line separated)"
          value={manualEmails}
          onChange={(e) => setManualEmails(e.target.value)}
        />
      )}

      {/* SUBJECT */}
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Email subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      {/* BODY */}
      <textarea
        className="border rounded px-3 py-2 w-full h-60"
        placeholder="Write your email (HTML allowed)..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {/* SEND */}
      <button
        className="bg-red-700 text-white px-6 py-3 rounded w-full max-w-xs"
        disabled={sending}
        onClick={sendEmail}
        type="button"
      >
        {sending ? "Sending…" : "Send Email"}
      </button>

      {/* RESULT PANEL */}
      {lastResult && (
        <div className="border rounded-lg bg-white p-4 text-sm">
          <div className="font-semibold mb-2">Last Send Result</div>
          <div className="text-gray-700">
            <div>
              <b>Status:</b> {lastResult.status || "—"}
            </div>
            <div>
              <b>Count:</b> {lastResult.count ?? "—"}
            </div>
            <div>
              <b>Sent:</b> {lastResult.sent ?? "—"}
            </div>
            <div>
              <b>Failed:</b> {lastResult.failed ?? "—"}
            </div>
          </div>

          {Array.isArray(lastResult.results) && lastResult.results.length > 0 && (
            <div className="mt-3 max-h-56 overflow-auto border rounded p-2 text-xs">
              {lastResult.results.slice(0, 200).map((r: any) => (
                <div key={r.email} className="flex justify-between gap-3">
                  <span className="truncate">{r.email}</span>
                  <span className={r.status === "sent" ? "text-green-700" : "text-red-700"}>
                    {r.status}
                  </span>
                </div>
              ))}
              {lastResult.results.length > 200 && (
                <div className="text-gray-500 mt-2">
                  Showing first 200 results…
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
