"use client";

import { useUnknownPresence } from "@/lib/useUnknownPresence";
import Link from "next/link";
import { useAppViewTracker } from "@/lib/useAppViewTracker";

export default function Home() {
  useUnknownPresence("home");
  
  useAppViewTracker({
    role: "unknown",   // unauthenticated / pre-login users
    companyId: null,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white border rounded-lg p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">
          TradePilot
        </h1>

        <p className="text-sm text-zinc-600 mb-6">
          Internal operations and partner management platform for Doorplace USA.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-2 rounded bg-black text-white hover:bg-zinc-800 transition"
          >
            Log In
          </Link>

          <Link
            href="https://doorplaceusa.com/pages/become-a-partner"
            className="w-full py-2 rounded border border-zinc-300 hover:bg-zinc-100 transition"
          >
            Create Account
          </Link>
        </div>

        <p className="text-xs text-zinc-400 mt-6">
          Authorized access only.
        </p>
      </div>
    </div>
  );
}
