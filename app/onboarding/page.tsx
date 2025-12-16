"use client";

import { useState } from "react";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email_address: "",
    cell_phone_number: "",
    business_name: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    coverage_area: "",
    preferred_contact_method: "",
    sales_experience: "",
    digital_signature: "",
    confirmation: "yes",
  });

  const setField = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/partners/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setMsg(
        "Thank you for submitting your Partner Onboarding Form! Your information has been received. You will be redirected to your Partner Dashboard shortly. If you do not receive an email within 12–24 hours, please check your spam or junk folder or reach out to customer support."
      );

      setTimeout(() => {
        window.location.href = "https://doorplaceusa.com/account";
      }, 9000);
    } catch (e) {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow border overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-6 border-b">
          <h1 className="text-2xl font-bold text-[#b80d0d]">
            Independent Partner Onboarding
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Welcome! Complete the steps below and submit the onboarding form to finalize your partner profile.
          </p>
        </div>

        {/* INFO SECTION */}
        <div className="px-6 py-5 space-y-5 border-b bg-gray-50">
          <div>
            <h2 className="font-semibold text-[#b80d0d] mb-2">Quick Checklist</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Review the Partner Dashboard page</li>
              <li>Update your contact information as needed</li>
              <li>Understand commission payouts</li>
              <li>Be familiar with custom swing options</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[#b80d0d] mb-2">Important Notes</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Commission payouts are processed 24–36 hours after your customer submits their deposit.</li>
              <li>The Swing Resource Page is your main hub for scripts, guides, and marketing materials.</li>
              <li>All customer swing orders must be submitted through the Swing Order Form.</li>
            </ul>
          </div>
        </div>

        {/* FORM */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First Name" value={form.first_name} onChange={(v) => setField("first_name", v)} />
          <Input label="Last Name" value={form.last_name} onChange={(v) => setField("last_name", v)} />

          <Input label="Email Address" type="email" value={form.email_address} onChange={(v) => setField("email_address", v)} />
          <Input label="Cell Phone Number" value={form.cell_phone_number} onChange={(v) => setField("cell_phone_number", v)} />

          <Input label="Business Name" value={form.business_name} onChange={(v) => setField("business_name", v)} />
          <Input label="Coverage Area" value={form.coverage_area} onChange={(v) => setField("coverage_area", v)} />

          <Input label="Street Address" value={form.street_address} onChange={(v) => setField("street_address", v)} />
          <Input label="City" value={form.city} onChange={(v) => setField("city", v)} />

          <Input label="State" value={form.state} onChange={(v) => setField("state", v)} />
          <Input label="ZIP Code" value={form.zip_code} onChange={(v) => setField("zip_code", v)} />

          <Select
            label="Preferred Contact Method"
            value={form.preferred_contact_method}
            onChange={(v) => setField("preferred_contact_method", v)}
            options={["", "Text", "Call", "Email"]}
          />

          <Select
            label="Sales Experience"
            value={form.sales_experience}
            onChange={(v) => setField("sales_experience", v)}
            options={["", "None", "Some", "A lot"]}
          />

          <div className="md:col-span-2">
            <Input
              label="Digital Signature (type your name)"
              value={form.digital_signature}
              onChange={(v) => setField("digital_signature", v)}
            />
          </div>

          {err && (
            <div className="md:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">
              {err}
            </div>
          )}

          {msg && (
            <div className="md:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 p-3 rounded">
              {msg}
            </div>
          )}

          <div className="md:col-span-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#b80d0d] hover:opacity-90 text-white font-bold py-3 rounded-lg disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Onboarding"}
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              By submitting, you confirm the information provided is accurate.
            </p>
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
