"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    // 1. Sign in
    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !data.user) {
      setError(authError?.message || "Login failed");
      setLoading(false);
      return;
    }

    // 2. Check PARTNERS table by email
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id")
      .eq("email_address", email)
      .maybeSingle();

    // 3. Route based on role
    if (partner && !partnerError) {
      // ✅ Partner
      router.push("/partners/dashboard");
    } else {
      // ✅ Admin
      router.push("/dashboard");
    }

    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-4">
          <h1 className="text-3xl font-bold text-red-700">TradePilot</h1>
          <p className="text-sm text-gray-500 mt-1">
            Powered by Doorplace USA
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-6 mb-6" />

        {/* Form */}
        <div className="px-6 pb-8">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-600"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            className="w-full p-3 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-red-600"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
