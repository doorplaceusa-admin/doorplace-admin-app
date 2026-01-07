"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SendPasswordReset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://tradepilot.doorplaceusa.com/reset-password",
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset email sent successfully.");
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-2">
        Send Password Reset
      </h3>

      <input
        type="email"
        placeholder="Partner email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
      />

      <button
        onClick={handleSend}
        disabled={loading || !email}
        className="w-full bg-red-700 hover:bg-red-800 text-white py-2 rounded"
      >
        {loading ? "Sending…" : "Send Reset Link"}
      </button>

      {message && (
        <p className="text-green-600 text-sm mt-3">{message}</p>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
