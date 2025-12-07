"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-blue-600">TradePilot</h1>

        <nav className="flex flex-col gap-4">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <Link href="/dashboard/companies" className="hover:text-blue-600">Companies</Link>
          <Link href="/dashboard/leads" className="hover:text-blue-600">Leads</Link>
          <Link href="/dashboard/partners" className="hover:text-blue-600">Partners</Link>
          <Link href="/dashboard/orders" className="hover:text-blue-600">Orders</Link>
          <Link href="/dashboard/commissions">Commissions</Link>
          <Link href="/dashboard/settings" className="hover:text-blue-600">Settings</Link>
        </nav>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="mt-auto bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Log out
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10 overflow-auto">
        {children}
      </div>

    </div>
  );
}
