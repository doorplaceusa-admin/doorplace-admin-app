"use client";

import { useState } from "react";

export default function ContractorSignupPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    business_name: "",
    city: "",
    state: "",
    zip: "",
    services: "",
    coverage_area: "",
    experience: "",
  });

  const setField = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const res = await fetch("/api/contractors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Submission failed");

      setMsg("Your application has been submitted. We will contact you if approved.");
      setForm({
        full_name: "",
        phone: "",
        email: "",
        business_name: "",
        city: "",
        state: "",
        zip: "",
        services: "",
        coverage_area: "",
        experience: "",
      });

    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow border p-6">

        <h1 className="text-2xl font-bold text-[#b80d0d] mb-2">
          Contractor Application
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Submit your information to be considered for job opportunities in your area.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input label="Full Name" value={form.full_name} onChange={(v) => setField("full_name", v)} />
          <Input label="Phone Number" value={form.phone} onChange={(v) => setField("phone", v)} />

          <Input label="Email Address" value={form.email} onChange={(v) => setField("email", v)} />
          <Input label="Business Name (Optional)" value={form.business_name} onChange={(v) => setField("business_name", v)} />

          <Input label="City" value={form.city} onChange={(v) => setField("city", v)} />
          <Input label="State" value={form.state} onChange={(v) => setField("state", v)} />

          <Input label="ZIP Code" value={form.zip} onChange={(v) => setField("zip", v)} />

          <div className="md:col-span-2">
            <Input label="Services You Offer (type anything)" value={form.services} onChange={(v) => setField("services", v)} />
          </div>

          <div className="md:col-span-2">
            <Input label="Coverage Area (cities or radius)" value={form.coverage_area} onChange={(v) => setField("coverage_area", v)} />
          </div>

          <div className="md:col-span-2">
            <Input label="Experience (years or description)" value={form.experience} onChange={(v) => setField("experience", v)} />
          </div>

          {err && (
            <div className="md:col-span-2 text-red-600 text-sm">{err}</div>
          )}

          {msg && (
            <div className="md:col-span-2 text-green-600 text-sm">{msg}</div>
          )}

          <div className="md:col-span-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#b80d0d] text-white py-3 rounded-lg font-bold"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

/* ---------- INPUT ---------- */

function Input({
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
      <span className="text-sm font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-lg p-2"
      />
    </label>
  );
}