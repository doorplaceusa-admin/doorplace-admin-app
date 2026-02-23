"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   SEGMENT LOGIC
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
    default:
      return query;
  }
}

/* ===============================
   TEMPLATE TYPE
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

  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>(
    {}
  );
  const [manualEmails, setManualEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [delayMs, setDelayMs] = useState(2000);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  /* ===============================
     TEMPLATE STATE
  ================================ */

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>("");

  /* ===============================
     AUTOMATION STATE
  ================================ */

  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [sendTime, setSendTime] = useState("08:00");
  const [fromKey, setFromKey] = useState("partners");
  const [currentSequence, setCurrentSequence] =
    useState<number | null>(null);
  const [lastSentDate, setLastSentDate] =
    useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  /* ===============================
     LOAD COUNTS
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
      let q = supabase
        .from("partners")
        .select("*", { count: "exact", head: true });
      q = applyPartnerSegment(q, s);
      const { count } = await q;
      results[s] = count || 0;
    }

    setSegmentCounts(results);
  }

  async function loadAutomationSettings() {
    const { data } = await supabase
      .from("email_automation_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!data) return;

    setAutomationEnabled(data.enabled);
    setSendTime(data.send_time);
    setSegment(data.segment as SegmentKey);
    setFromKey(data.from_key);
    setCurrentSequence(data.current_sequence);
    setLastSentDate(data.last_sent_date);
  }

  useEffect(() => {
    loadCounts();
    loadAutomationSettings();

    const stored = localStorage.getItem("tp_email_templates");
    if (stored) setTemplates(JSON.parse(stored));
  }, []);

  /* ===============================
     TEMPLATE HANDLING
  ================================ */

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
     SAVE AUTOMATION
  ================================ */

  async function saveAutomationSettings() {
    setSavingSettings(true);

    await supabase
      .from("email_automation_settings")
      .update({
        enabled: automationEnabled,
        send_time: sendTime,
        segment,
        from_key: fromKey,
      })
      .eq("id", 1);

    alert("Automation settings saved.");
    setSavingSettings(false);
  }

  async function sendTodayNow() {
    if (!confirm("Send today's automated email now?")) return;

    await supabase
      .from("email_automation_settings")
      .update({ last_sent_date: null })
      .eq("id", 1);

    alert("Worker will send within 60 seconds.");
  }

  /* ===============================
     SEND EMAIL
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
      if (!list.length) {
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
    } finally {
      setSending(false);
    }
  }

  /* ===============================
     UI
  ================================ */

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-375 w-full mx-auto p-6 space-y-4">
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <h1 className="text-3xl font-bold text-red-700">Email</h1>
        <p className="text-sm text-gray-500">
          TradePilot — Partner Email System
        </p>
      </div>

      {/* AUTOMATION PANEL */}
      <div className="bg-white border rounded p-4 space-y-4">
        <h3 className="font-semibold text-lg">Daily Automation</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={automationEnabled}
            onChange={(e) => setAutomationEnabled(e.target.checked)}
          />
          Enable Daily Automation
        </label>

        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="text-xs text-gray-500">Send Time</label>
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="border rounded px-2 py-1 block"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">From</label>
            <select
              value={fromKey}
              onChange={(e) => setFromKey(e.target.value)}
              className="border rounded px-2 py-1 block"
            >
              <option value="partners">Partners</option>
              <option value="support">Support</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <div><b>Current Sequence:</b> {currentSequence ?? "-"}</div>
          <div><b>Last Sent:</b> {lastSentDate ?? "Never"}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveAutomationSettings}
            disabled={savingSettings}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {savingSettings ? "Saving…" : "Save Settings"}
          </button>

          <button
            onClick={sendTodayNow}
            className="bg-red-700 text-white px-4 py-2 rounded"
          >
            Send Today Now
          </button>
        </div>
      </div>

      {/* SUBJECT */}
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Email subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      {/* BODY + PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          className="border rounded px-3 py-2 h-60"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="border rounded bg-white p-4 h-60 overflow-auto">
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </div>
      </div>

      <button
        className="bg-red-700 text-white px-6 py-3 rounded w-full max-w-xs"
        disabled={sending}
        onClick={sendEmail}
      >
        {sending ? "Sending…" : "Send Email"}
      </button>
    </div>
  );
}