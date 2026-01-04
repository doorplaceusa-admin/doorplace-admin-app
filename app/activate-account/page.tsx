"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ActivateAccountPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Create auth user (or return existing)
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            "https://tradepilot.doorplaceusa.com/auth/callback",
        },
      });

      if (authError && !authError.message.includes("already registered")) {
        throw new Error(authError.message);
      }

      const userId = data?.user?.id;
      if (!userId) {
        throw new Error("This account is already registered. Your profile is currently pending approval.");
      }

      // 2. Link auth user to existing partner + send verification email (backend)
      const res = await fetch("/api/partners/link-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: userId,
          email_address: email,
        }),
      });

      const json = await res.json();

      // 🚨 Treat "already activated" as SUCCESS
      if (!res.ok && json?.error !== "Account already activated") {
        throw new Error(json?.error || "Activation failed");
      }

      setSuccess(true);

      // ✅ Always redirect
      setTimeout(() => {
        router.replace("/pending");
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow border p-6">
        <h1 className="text-2xl font-bold text-[#b80d0d] mb-2">
          Activate Your TradePilot Account
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          Existing Doorplace USA partners only.  
          Set your password to access TradePilot.
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border p-2 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border p-2 rounded">
            Account activated. Please check your email to confirm.
            Redirecting…
          </div>
        )}

        <input
          type="email"
          placeholder="Email address"
          className="w-full p-3 border rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Create password"
          className="w-full p-3 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleActivate}
          disabled={loading}
          className="w-full bg-[#b80d0d] text-white py-3 rounded font-semibold disabled:opacity-60"
        >
          {loading ? "Activating..." : "Activate Account"}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          © 2026 TradePilot — Built by Doorplace USA
        </p>
      </div>
    </div>
  );
}
