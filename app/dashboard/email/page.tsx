"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   SEGMENTS
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
     AUTOMATION STATE
  ================================ */

  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [sendTime, setSendTime] = useState("08:00");
  const [fromKey, setFromKey] = useState("partners");
  const [currentSequence, setCurrentSequence] = useState<number | null>(null);
  const [lastSentDate, setLastSentDate] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  /* ===============================
     TEMPLATE STATE
  ================================ */

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  /* ===============================
     LOAD INITIAL DATA
  ================================ */

  useEffect(() => {
    loadCounts();
    loadAutomationSettings();

    const stored = localStorage.getItem("tp_email_templates");
    if (stored) setTemplates(JSON.parse(stored));
  }, []);

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
      const { count } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true });

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
    setSegment(data.segment);
    setFromKey(data.from_key);
    setCurrentSequence(data.current_sequence);
    setLastSentDate(data.last_sent_date);
  }

  /* ===============================
     TEMPLATE FUNCTIONS
  ================================ */

  function persistTemplates(next: EmailTemplate[]) {
    setTemplates(next);
    localStorage.setItem("tp_email_templates", JSON.stringify(next));
  }

  function saveTemplate() {
    if (!templateName.trim()) return alert("Template name required");

    const tpl: EmailTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject,
      body,
    };

    persistTemplates([tpl, ...templates]);
    setTemplateName("");
  }

  function loadTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  /* ===============================
     AUTOMATION SAVE
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

    setSavingSettings(false);
    alert("Automation settings saved.");
  }

  async function sendTodayNow() {
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
      return alert("Subject and body required.");
    }

    setSending(true);

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
    setSending(false);
  }

  /* ===============================
     UI
  ================================ */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <h1 className="text-3xl font-bold text-red-700">
        Email Control Center
      </h1>

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

        <div className="flex gap-4">
          <input
            type="time"
            value={sendTime}
            onChange={(e) => setSendTime(e.target.value)}
            className="border px-2 py-1 rounded"
          />

          <select
            value={fromKey}
            onChange={(e) => setFromKey(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="partners">Partners</option>
            <option value="support">Support</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          <div><b>Sequence:</b> {currentSequence ?? "-"}</div>
          <div><b>Last Sent:</b> {lastSentDate ?? "Never"}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveAutomationSettings}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Save Settings
          </button>

          <button
            onClick={sendTodayNow}
            className="bg-red-700 text-white px-4 py-2 rounded"
          >
            Send Today Now
          </button>
        </div>
      </div>

      {/* MODE + DELAY */}
      <div className="flex gap-4 items-center">
        <button onClick={() => setMode("segment")}>Segment</button>
        <button onClick={() => setMode("manual")}>Manual</button>

        <input
          type="number"
          value={delayMs}
          onChange={(e) => setDelayMs(Number(e.target.value))}
          className="border px-2 py-1 rounded"
        />
      </div>

      {/* TEMPLATE MANAGER */}
      <div className="bg-white border rounded p-4 space-y-2">
        <input
          placeholder="Template name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="border px-2 py-1 w-full"
        />
        <button onClick={saveTemplate}>Save Template</button>

        <select onChange={(e) => loadTemplate(e.target.value)}>
          <option>Load template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* SUBJECT */}
      <input
        className="border px-3 py-2 w-full rounded"
        placeholder="Email subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      {/* BODY */}
      <textarea
        className="border px-3 py-2 w-full h-60 rounded"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <button
        onClick={sendEmail}
        disabled={sending}
        className="bg-red-700 text-white px-6 py-3 rounded"
      >
        {sending ? "Sending…" : "Send Email"}
      </button>

    </div>
  );
}