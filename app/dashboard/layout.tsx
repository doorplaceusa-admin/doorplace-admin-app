"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Menu } from "lucide-react"; // Make sure it's installed

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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

      {/* 🔵 MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white shadow flex items-center px-4 z-50">
        <button onClick={() => setMobileOpen(true)}>
          <Menu className="w-7 h-7 text-gray-700" />
        </button>
        <h1 className="ml-4 font-bold text-lg text-blue-600">
          TradePilot
        </h1>
      </div>

      {/* 🔵 SIDEBAR */}
      <div
        className={`
          fixed md:static top-0 left-0 h-full w-64 bg-white shadow-md p-6 flex flex-col
          transform transition-transform duration-300 z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Desktop Title */}
        <h1 className="text-2xl font-bold mb-1 text-blue-600 hidden md:block">
          TradePilot
        </h1>

        {/* Branding line */}
        <p className="text-xs text-gray-500 mb-8 hidden md:block">
          Powered by Doorplace USA
        </p>

        <nav className="flex flex-col gap-4 text-gray-700 font-medium">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          <Link href="/dashboard/companies" onClick={() => setMobileOpen(false)}>Companies</Link>
          <Link href="/dashboard/leads" onClick={() => setMobileOpen(false)}>Leads</Link>
          <Link href="/dashboard/partners" onClick={() => setMobileOpen(false)}>Partners</Link>
          <Link href="/dashboard/orders" onClick={() => setMobileOpen(false)}>Orders</Link>
          <Link href="/dashboard/commissions" onClick={() => setMobileOpen(false)}>Commissions</Link>
          <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}>Settings</Link>
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

      {/* 🔵 SCREEN OVERLAY WHEN SIDEBAR OPEN */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 🔵 MAIN CONTENT */}
      <div className="flex-1 p-6 md:p-10 overflow-auto mt-14 md:mt-0">
        {children}
      </div>
    </div>
  );
}
