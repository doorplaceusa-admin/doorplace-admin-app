"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAppViewTracker } from "@/lib/useAppViewTracker";





export default function LoginPage() {
  const router = useRouter();

  useAppViewTracker({
    role: "unknown",
    companyId: null,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);



  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

 

  /* ===============================
     LOGIN
  ================================ */
  const handleLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(authError?.message || "Login failed");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile?.role) {
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

  /* ===============================
     PASSWORD RECOVERY
  ================================ */
  const handleRecover = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset link sent. Check your email.");
      setRecovering(false);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <img
            src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_8361.jpg?v=1767366750"
            alt="Doorplace USA"
            className="h-14 object-contain"
          />
        </div>

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-center text-gray-900">
          TradePilot
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Powered by <span className="font-semibold">Doorplace USA</span>
        </p>

        {/* ERROR */}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
            {message}
          </div>
        )}

        {/* EMAIL */}
        <input
          className="w-full p-3 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-600"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {!recovering && (
          <>
            {/* PASSWORD + TOGGLE */}
            <div className="relative mb-4">
              <input
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 pr-12"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* LOGIN */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Log In"}
            </button>

            {/* FORGOT PASSWORD */}
            <button
              onClick={() => setRecovering(true)}
              className="mt-4 text-sm text-red-700 hover:underline w-full text-center"
            >
              Forgot your password?
            </button>
          </>
        )}

        {recovering && (
          <>
            <button
              onClick={handleRecover}
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send Password Reset Link"}
            </button>

            <button
              onClick={() => setRecovering(false)}
              className="mt-4 text-sm text-gray-600 hover:underline w-full text-center"
            >
              Back to login
            </button>
          </>
        )}

        {/* CREATE ACCOUNT */}
        <div className="text-center mt-6 text-sm">
          <span className="text-gray-500">Don’t have an account?</span>{" "}
          <Link
            href="https://doorplaceusa.com/pages/become-a-partner"
            className="text-red-700 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TradePilot — Built by Doorplace USA
        </div>

      </div>
    </div>
  );
}
