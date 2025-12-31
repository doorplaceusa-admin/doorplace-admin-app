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

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(authError?.message || "Login failed");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile?.role) {
      router.push("/pending");
      return;
    }

    if (profile.role === "admin") {
      router.push("/dashboard");
    } else if (profile.role === "partner") {
      router.push("/partners/dashboard");
    } else {
      router.push("/pending");
    }

    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow border p-6">
        <h1 className="text-2xl font-bold text-red-700 mb-4">TradePilot</h1>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <input
          className="w-full p-3 border rounded mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-red-700 text-white py-3 rounded disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log In"}
        </button>
      </div>
    </div>
  );
}
