"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppViewTracker } from "@/lib/useAppViewTracker";


import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  useAppViewTracker({
  role: "unknown", // or "admin" | "partner"
  companyId: null,
});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(e: any) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded shadow w-80 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Create Account</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="border w-full p-2 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border w-full p-2 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-black text-white w-full p-2 rounded hover:bg-gray-800"
        >
          Sign Up
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
