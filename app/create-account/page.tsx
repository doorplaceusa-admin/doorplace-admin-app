"use client";

import { useUnknownPresence } from "@/lib/useUnknownPresence";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppViewTracker } from "@/lib/useAppViewTracker";



const REDIRECT_DELAY_MS = 5000;

export default function CreateAccountPage() {
  const router = useRouter();
  useUnknownPresence("create-account");

  
 useAppViewTracker({
    role: "unknown",
    companyId: null,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_MS / 1000);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
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
  });

  const setField = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!success) return;

    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      router.replace("/pending");
    }, REDIRECT_DELAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [success, router]);

  const handleSubmit = async () => {
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
  email: form.email,
  password: form.password,
  options: {
    emailRedirectTo: "https://tradepilot.doorplaceusa.com/auth/callback",
  },
});


      if (authError || !data.user) {
        throw new Error(authError?.message || "Account creation failed.");
      }

      const res = await fetch("/api/partners/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: data.user.id,
          first_name: form.first_name,
          last_name: form.last_name,
          email_address: form.email,
          cell_phone_number: form.cell_phone_number,
          business_name: form.business_name,
          coverage_area: form.coverage_area,
          street_address: form.street_address,
          city: form.city,
          state: form.state,
          zip_code: form.zip_code,
          preferred_contact_method: form.preferred_contact_method,
          sales_experience: form.sales_experience,
          digital_signature: form.digital_signature,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Partner creation failed.");

      setSuccess(true);
      setMsg(
        "Your account has been created successfully. Please confirm your email address. You will be redirected shortly."
      );
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
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
            Create Partner Account
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Create your TradePilot partner account to access your dashboard.
          </p>
        </div>

        {/* INFO SECTION */}
        <div className="px-6 py-5 space-y-4 border-b bg-gray-50">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Confirm your email after submitting</li>
            <li>Your account will start in pending status</li>
            <li>You’ll gain access once approved</li>
          </ul>
        </div>

        {/* FORM */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input label="First Name" value={form.first_name} onChange={(v) => setField("first_name", v)} />
          <Input label="Last Name" value={form.last_name} onChange={(v) => setField("last_name", v)} />

          <Input label="Email Address" type="email" value={form.email} onChange={(v) => setField("email", v)} />
          <Input label="Password" type="password" value={form.password} onChange={(v) => setField("password", v)} />

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
              {success && (
                <div className="mt-1 text-xs text-gray-600">
                  Redirecting in {secondsLeft} seconds…
                </div>
              )}
            </div>
          )}

          <div className="md:col-span-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#b80d0d] hover:opacity-90 text-white font-bold py-3 rounded-lg disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
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

/* ---------- Shared Inputs ---------- */

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
