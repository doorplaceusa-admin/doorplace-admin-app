"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  Menu,
  LayoutDashboard,
  Building2,
  ClipboardList,
  Handshake,
  Package,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setLoggedIn(!!data.session);
      setLoading(false);
      if (!data.session) router.replace("/login");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      if (!session) router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) return null;

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex min-h-screen">

          {/* DESKTOP SIDEBAR */}
          {loggedIn && (
            <aside
              className={`hidden md:flex flex-col bg-white shadow transition-all duration-300 ${
                sidebarOpen ? "w-64" : "w-16"
              }`}
            >
              <div className="flex items-center justify-between p-4">
                {sidebarOpen && (
                  <span className="text-xl font-bold text-red-700">
                    TradePilot
                  </span>
                )}
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu />
                </button>
              </div>

              <nav className="flex flex-col gap-4 px-4 text-sm">
                <NavItem icon={<LayoutDashboard />} label="Dashboard" href="/dashboard" open={sidebarOpen} />
                <NavItem icon={<Building2 />} label="Companies" href="/dashboard/companies" open={sidebarOpen} />
                <NavItem icon={<ClipboardList />} label="Leads" href="/dashboard/leads" open={sidebarOpen} />
                <NavItem icon={<Handshake />} label="Partners" href="/dashboard/partners" open={sidebarOpen} />
                <NavItem icon={<Package />} label="Orders" href="/dashboard/orders" open={sidebarOpen} />
                <NavItem icon={<DollarSign />} label="Commissions" href="/dashboard/commissions" open={sidebarOpen} />
                <NavItem icon={<Settings />} label="Settings" href="/dashboard/settings" open={sidebarOpen} />
              </nav>

              <button
                onClick={handleLogout}
                className="mt-auto m-4 flex items-center gap-2 text-red-600"
              >
                <LogOut />
                {sidebarOpen && "Log out"}
              </button>
            </aside>
          )}

          {/* MAIN CONTENT */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>

          {/* MOBILE BOTTOM NAV */}
          {loggedIn && (
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 md:hidden">
              <MobileNav href="/dashboard" icon={<LayoutDashboard />} />
              <MobileNav href="/dashboard/leads" icon={<ClipboardList />} />
              <MobileNav href="/dashboard/orders" icon={<Package />} />
              <MobileNav href="/dashboard/partners" icon={<Handshake />} />
              <MobileNav href="/dashboard/settings" icon={<Settings />} />
            </nav>
          )}
        </div>
      </body>
    </html>
  );
}

/* ---------- Helpers ---------- */

function NavItem({
  icon,
  label,
  href,
  open,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  open: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3">
      {icon}
      {open && <span>{label}</span>}
    </Link>
  );
}

function MobileNav({
  icon,
  href,
}: {
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="text-gray-700">
      {icon}
    </Link>
  );
}
