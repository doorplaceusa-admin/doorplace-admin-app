"use client";

import { useState } from "react";
import { createClientHelper } from "@/lib/supabaseClient";


import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientHelper();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-center">TradePilot Login</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Email address"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
