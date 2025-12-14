"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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
            className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
