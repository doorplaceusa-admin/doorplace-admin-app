"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutGrid,
  ClipboardList,
  Package,
  Handshake,
  Settings,
  Bell,
  User,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-64 bg-white shadow flex-col p-6">
        <h1 className="text-2xl font-bold text-red-700 mb-6">
          TradePilot
          <span className="block text-sm font-normal text-gray-500">
            Powered by Doorplace USA
          </span>
        </h1>

        <nav className="flex flex-col gap-4 text-sm">
          <NavLink href="/dashboard" icon={<LayoutGrid size={18} />} label="Dashboard" />
          <NavLink href="/dashboard/leads" icon={<ClipboardList size={18} />} label="Leads" />
          <NavLink href="/dashboard/orders" icon={<Package size={18} />} label="Orders" />
          <NavLink href="/dashboard/partners" icon={<Handshake size={18} />} label="Partners" />
          <NavLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col">

        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow">
          <User size={22} />
          <span className="font-semibold">TradePilot</span>
          <Bell size={22} />
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 pb-24 md:pb-6">
          {children}
        </main>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
          <MobileNavItem href="/dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" />
          <MobileNavItem href="/dashboard/leads" icon={<ClipboardList size={20} />} label="Leads" />
          <MobileNavItem href="/dashboard/orders" icon={<Package size={20} />} label="Orders" />
          <MobileNavItem href="/dashboard/partners" icon={<Handshake size={20} />} label="Partners" />
          <MobileNavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>
      </div>
    </div>
  );
}

/* ===== DESKTOP NAV LINK ===== */
function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 text-gray-700 hover:text-red-700"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

/* ===== MOBILE NAV ITEM ===== */
function MobileNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center text-xs text-gray-700"
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}
