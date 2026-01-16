// app/dashboard/email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   SEGMENT LOGIC (UNCHANGED)
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
      return query.not("auth_user_id", "is", null).eq("email_verified", true).eq("status", "pending");
    case "welcome_email_not_sent_login":
      return query.not("auth_user_id", "is", null).eq("status", "pending").eq("welcome_email_sent", false);
    default:
      return query;
  }
}

/* ===============================
   TEMPLATE TYPE (NEW)
================================ */

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

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

  /* ===============================
     TEMPLATE STATE (NEW)
  ================================ */

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  /* ===============================
     LOAD COUNTS (UNCHANGED)
  ================================ */

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
      const { count } = await q;
      results[s] = count || 0;
    }

    setSegmentCounts(results);
  }

  /* ===============================
     LOAD TEMPLATES (NEW)
  ================================ */

  useEffect(() => {
    loadCounts();
    const stored = localStorage.getItem("tp_email_templates");
    if (stored) setTemplates(JSON.parse(stored));
  }, []);

  function persistTemplates(next: EmailTemplate[]) {
    setTemplates(next);
    localStorage.setItem("tp_email_templates", JSON.stringify(next));
  }

  function saveTemplate() {
    if (!templateName.trim()) {
      alert("Template name required");
      return;
    }

    const tpl: EmailTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject,
      body,
    };

    persistTemplates([tpl, ...templates]);
    setTemplateName("");
    setSelectedTemplateId(tpl.id);
  }

  function loadTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSubject(tpl.subject);
    setBody(tpl.body);
    setSelectedTemplateId(id);
  }

  /* ===============================
     SEND EMAIL (UNCHANGED)
  ================================ */

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
          ? { mode: "manual", to: manualEmails, subject, html: body, delayMs }
          : { mode: "segment", segment, subject, html: body, delayMs };

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLastResult(data);

      if (!res.ok) {
        alert(data?.error || "Email failed");
        return;
      }

      alert(
        `Done. Sent: ${data.sent} / ${data.count}. Failed: ${data.failed}.`
      );
    } catch {
      alert("Unexpected error sending email.");
    } finally {
      setSending(false);
    }
  }

  /* ===============================
     UI
  ================================ */

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-[1500px] w-full mx-auto p-6 space-y-4">
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <h1 className="text-3xl font-bold text-red-700">Email</h1>
        <p className="text-sm text-gray-500">TradePilot — Partner Email System</p>
      </div>

      {/* MODE + DELAY (UNCHANGED) */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2">
          <button className={`px-3 py-1 text-sm rounded border ${mode === "segment" ? "bg-black text-white" : ""}`} onClick={() => setMode("segment")}>Segment</button>
          <button className={`px-3 py-1 text-sm rounded border ${mode === "manual" ? "bg-black text-white" : ""}`} onClick={() => setMode("manual")}>Manual</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Delay</span>
          <input className="border rounded px-2 py-1 w-[110px] text-sm" type="number" min={0} step={250} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value || 0))} />
          <span className="text-xs text-gray-500">ms</span>
        </div>
      </div>

      {/* TEMPLATE MANAGER (NEW) */}
      <div className="bg-white border rounded p-4 space-y-2">
        <h3 className="font-semibold">Templates</h3>
        <div className="flex gap-2">
          <input className="border px-2 py-1 w-full" placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
          <button className="bg-black text-white px-4 rounded" onClick={saveTemplate}>Save</button>
        </div>
        <select className="border px-2 py-1 w-full" value={selectedTemplateId} onChange={(e) => loadTemplate(e.target.value)}>
          <option value="">Load template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* RECIPIENTS (UNCHANGED) */}
      {mode === "segment" ? (
        <select className="border rounded px-3 py-2 w-full max-w-md" value={segment} onChange={(e) => setSegment(e.target.value as SegmentKey)}>
          <option value="all">All ({segmentCounts.all || 0})</option>
          <option value="login_users">Login Users ({segmentCounts.login_users || 0})</option>
          <option value="no_login">No Login Yet ({segmentCounts.no_login || 0})</option>
          <option value="email_not_verified">Email Not Verified ({segmentCounts.email_not_verified || 0})</option>
          <option value="ready_for_activation">Ready for Activation ({segmentCounts.ready_for_activation || 0})</option>
          <option value="welcome_email_not_sent_login">Welcome Email Not Sent ({segmentCounts.welcome_email_not_sent_login || 0})</option>
          <option value="pending">Pending ({segmentCounts.pending || 0})</option>
          <option value="active">Active ({segmentCounts.active || 0})</option>
        </select>
      ) : (
        <input className="border rounded px-3 py-2 w-full" placeholder="Emails…" value={manualEmails} onChange={(e) => setManualEmails(e.target.value)} />
      )}

      {/* SUBJECT */}
      <input className="border rounded px-3 py-2 w-full" placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />

      {/* BODY + PREVIEW (NEW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea className="border rounded px-3 py-2 h-60" placeholder="HTML allowed…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="border rounded bg-white p-4 h-60 overflow-auto">
          <div className="text-xs text-gray-400 mb-2">Live Preview</div>
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </div>
      </div>

      {/* SEND */}
      <button className="bg-red-700 text-white px-6 py-3 rounded w-full max-w-xs" disabled={sending} onClick={sendEmail}>
        {sending ? "Sending…" : "Send Email"}
      </button>

      {/* RESULTS PANEL (UNCHANGED) */}
      {lastResult && (
        <div className="border rounded-lg bg-white p-4 text-sm">
          <div className="font-semibold mb-2">Last Send Result</div>
          <div><b>Sent:</b> {lastResult.sent}</div>
          <div><b>Failed:</b> {lastResult.failed}</div>
        </div>
      )}
    </div>
  );
}
