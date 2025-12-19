"use client";

import { useState, useEffect, type ChangeEvent } from "react";

export default function LeadIntakeForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email_address: "",
    customer_phone: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    business_name: "",
    spoken_with_rep: "",
    sales_rep_name: "",
    looking_for: "",
    other_looking_for: "",
    size_needed: "",
    need_installation: "",
    installation_notes: "",
    additional_details: "",
    start_timeline: "",
    heard_about_us: "",
    other_heard_about_us: "",
    digital_signature: "",
    confirmation: false,
    partner_id: "",
  });

  /* ============================
     CAPTURE PARTNER ID FROM URL
  ============================ */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("partner_id") || "";
    if (pid) {
      setForm((p) => ({ ...p, partner_id: pid, heard_about_us: "Partner Link" }));
    }
  }, []);

  const setField = (k: keyof typeof form, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list.slice(0, 3));
  };

  const handleSubmit = async () => {
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, String(v ?? ""));
      });

      files.forEach((f) => fd.append("images", f));

      const res = await fetch("/api/leads/intake", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Submission failed.");
      }

      setMsg(
        "Thank you for contacting Doorplace USA! Your request has been received. Our team will review your information and reach out shortly."
      );

      setTimeout(() => {
        window.location.href = "https://doorplaceusa.com/pages/thank-you";
      }, 1000);
    } catch (e: any) {
      setErr(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow border overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="px-6 py-6 border-b">
          <h1 className="text-2xl font-bold text-[#b80d0d]">
            Contact Us / Request a Quote
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Use this form to contact Doorplace USA or request pricing for a
            custom door, porch swing, or installation service.
          </p>
        </div>

        {/* ================= INFO BLOCK ================= */}
        <div className="px-6 py-5 border-b bg-gray-50">
          <h2 className="font-semibold text-[#b80d0d] mb-2">
            For the fastest and most accurate quote, please include:
          </h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Clear photos of your project area</li>
            <li>Any measurements you already have</li>
            <li>Whether you need installation</li>
          </ul>
        </div>

        {/* ================= FORM ================= */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={form.first_name}
            onChange={(v: string) => setField("first_name", v)}
          />
          <Input
            label="Last Name"
            value={form.last_name}
            onChange={(v: string) => setField("last_name", v)}
          />

          <Input
            label="Email Address"
            type="email"
            value={form.email_address}
            onChange={(v: string) => setField("email_address", v)}
          />
          <Input
            label="Customer Phone"
            value={form.customer_phone}
            onChange={(v: string) => setField("customer_phone", v)}
          />

          <Input
            label="Street Address"
            value={form.street_address}
            onChange={(v: string) => setField("street_address", v)}
          />
          <Input
            label="City"
            value={form.city}
            onChange={(v: string) => setField("city", v)}
          />

          <Input
            label="State"
            value={form.state}
            onChange={(v: string) => setField("state", v)}
          />
          <Input
            label="ZIP Code"
            value={form.zip_code}
            onChange={(v: string) => setField("zip_code", v)}
          />

          <Input
            label="Business Name (optional)"
            value={form.business_name}
            onChange={(v: string) => setField("business_name", v)}
          />

          <Select
            label="Have you spoken with a Doorplace USA sales rep?"
            value={form.spoken_with_rep}
            onChange={(v: string) => setField("spoken_with_rep", v)}
            options={["", "Yes", "No"]}
          />

          {form.spoken_with_rep === "Yes" && (
            <Input
              label="If yes, list the sales rep's name"
              value={form.sales_rep_name}
              onChange={(v: string) => setField("sales_rep_name", v)}
            />
          )}

          <Select
            label="What are you looking for?"
            value={form.looking_for}
            onChange={(v: string) => setField("looking_for", v)}
            options={[
              "",
              "Custom Door",
              "Custom Porch Swing",
              "Swing Installation",
              "Door Installation",
              "Repair",
              "Other",
            ]}
          />

          {form.looking_for === "Other" && (
            <Input
              label="If Other, please specify"
              value={form.other_looking_for}
              onChange={(v: string) => setField("other_looking_for", v)}
            />
          )}

          <Select
            label="What size door or swing do you need?"
            value={form.size_needed}
            onChange={(v: string) => setField("size_needed", v)}
            options={[
              "",
              "Not sure - please help me choose",
              "Crib swing",
              "Twin swing",
              "Full swing",
              "Standard door",
              "Custom door size",
            ]}
          />

          <Select
            label="Do you need installation?"
            value={form.need_installation}
            onChange={(v: string) => setField("need_installation", v)}
            options={["", "Yes", "No"]}
          />

          {form.need_installation === "Yes" && (
            <div className="md:col-span-2">
              <Textarea
                label="Installation Notes"
                value={form.installation_notes}
                onChange={(v: string) => setField("installation_notes", v)}
              />
            </div>
          )}

          <div className="md:col-span-2">
            <Textarea
              label="Additional Project Details"
              value={form.additional_details}
              onChange={(v: string) => setField("additional_details", v)}
            />
          </div>

          <Select
            label="How soon are you looking to start?"
            value={form.start_timeline}
            onChange={(v: string) => setField("start_timeline", v)}
            options={[
              "",
              "As soon as possible",
              "Within 30 days",
              "1–3 months",
              "Just gathering quotes",
            ]}
          />

          <Select
            label="How did you hear about Doorplace USA?"
            value={form.heard_about_us}
            onChange={(v: string) => setField("heard_about_us", v)}
            options={[
              "",
              "Facebook Marketplace",
              "Google Search",
              "Referral",
              "Partner Link",
              "Other",
            ]}
          />

          {form.heard_about_us === "Other" && (
            <Input
              label="If Other, please specify"
              value={form.other_heard_about_us}
              onChange={(v: string) => setField("other_heard_about_us", v)}
            />
          )}

          {/* ================= UPLOADS ================= */}
          <div className="md:col-span-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                Upload Project Photos (max 3 images)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="mt-1 w-full border rounded-lg p-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {files.length}/3 images selected
              </p>
            </label>
          </div>

          <div className="md:col-span-2">
            <Input
              label="Digital Signature (type your full name)"
              value={form.digital_signature}
              onChange={(v: string) => setField("digital_signature", v)}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.confirmation}
              onChange={(e) => setField("confirmation", e.target.checked)}
            />
            <span className="text-sm text-gray-600">
              I confirm that the information provided is accurate
            </span>
          </div>

          {err && (
            <div className="md:col-span-2 text-sm text-red-700 bg-red-50 border p-3 rounded">
              {err}
            </div>
          )}

          {msg && (
            <div className="md:col-span-2 text-sm text-green-800 bg-green-50 border p-3 rounded">
              {msg}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !form.confirmation}
              className="w-full bg-[#b80d0d] hover:opacity-90 text-white font-bold py-3 rounded-lg disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#b80d0d]/40"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#b80d0d]/40"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#b80d0d]/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "Select..." : o}
          </option>
        ))}
      </select>
    </label>
  );
}
