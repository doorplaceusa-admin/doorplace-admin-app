"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Menu } from "lucide-react";

const brandRed = "#b80d0d";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex h-screen bg-gray-100 overflow-x-hidden">

      {/* ===================== MOBILE HEADER ===================== */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow flex items-center px-4 z-50">
        <button onClick={() => setMobileOpen(true)}>
          <Menu className="w-7 h-7" style={{ color: brandRed }} />
        </button>

        <div className="ml-4 flex flex-col leading-tight">
          <span className="font-bold text-lg" style={{ color: brandRed }}>
            TradePilot
          </span>
          <span className="text-xs font-medium" style={{ color: brandRed }}>
            Powered by Doorplace USA
          </span>
        </div>
      </div>

      {/* ===================== SIDEBAR ===================== */}
      <div
        className={`
          fixed md:static z-50 top-0 left-0 h-full w-64 bg-white shadow-md p-6 flex flex-col
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >

        {/* DESKTOP LOGO */}
        <div className="hidden md:flex flex-col mb-8">
          <span className="text-2xl font-bold" style={{ color: brandRed }}>
            TradePilot
          </span>
          <span className="text-sm font-medium mt-1" style={{ color: brandRed }}>
            Powered by Doorplace USA
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-4 text-black font-medium">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          <Link href="/dashboard/companies" onClick={() => setMobileOpen(false)}>Companies</Link>
          <Link href="/dashboard/leads" onClick={() => setMobileOpen(false)}>Leads</Link>
          <Link href="/dashboard/partners" onClick={() => setMobileOpen(false)}>Partners</Link>
          <Link href="/dashboard/orders" onClick={() => setMobileOpen(false)}>Orders</Link>
          <Link href="/dashboard/commissions" onClick={() => setMobileOpen(false)}>Commissions</Link>
          <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}>Settings</Link>
        </nav>

        {/* FOOTER BRANDING */}
        <div className="mt-auto mb-4 text-center text-sm font-semibold" style={{ color: brandRed }}>
          Powered by Doorplace USA
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Log out
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="flex-1 p-6 md:p-10 overflow-auto mt-16 md:mt-0">
        {children}
      </div>
    </div>
  );
}
