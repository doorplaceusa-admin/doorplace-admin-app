"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

/* ICONS – clean outline style */
import {
  Bell,
  User,
  LayoutGrid,
  ClipboardList,
  Package,
  Handshake,
  Settings,
  X
} from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setLoading(false);
      if (!data.session) router.replace("/login");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
        if (!session) router.replace("/login");
      }
    );

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
            <aside className="hidden md:flex w-64 bg-white shadow p-6 flex-col">
              <h1 className="text-2xl font-bold mb-6 text-red-700">
                Admin Menu
              </h1>

              <nav className="flex flex-col gap-3">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/dashboard/companies">Companies</Link>
                <Link href="/dashboard/leads">Leads</Link>
                <Link href="/dashboard/partners">Partners</Link>
                <Link href="/dashboard/orders">Orders</Link>
                <Link href="/dashboard/commissions">Commissions</Link>
                <Link href="/dashboard/settings">Settings</Link>
              </nav>

              <button
                onClick={handleLogout}
                className="mt-auto bg-red-600 text-white py-2 rounded"
              >
                Log out
              </button>
            </aside>
          )}

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col">

            {/* MOBILE TOP BAR */}
            {loggedIn && (
              <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow">
                <button onClick={() => setProfileOpen(true)}>
                  <User size={22} />
                </button>

                <h1 className="font-semibold">TradePilot</h1>

                <button>
                  <Bell size={22} />
                </button>
              </header>
            )}

            {/* PROFILE SLIDE MENU */}
            {profileOpen && (
              <div className="fixed inset-0 bg-black/30 z-50 md:hidden">
                <div className="absolute top-0 left-0 w-72 h-full bg-white shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Account</span>
                    <button onClick={() => setProfileOpen(false)}>
                      <X size={20} />
                    </button>
                  </div>

                  <nav className="flex flex-col gap-4">
                    <Link href="/dashboard/settings">Settings</Link>
                    <button
                      onClick={handleLogout}
                      className="text-left text-red-600"
                    >
                      Log out
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* PAGE CONTENT */}
            <main className="flex-1 p-4 pb-24 md:pb-6">
              {children}
            </main>

            {/* MOBILE BOTTOM NAV */}
            {loggedIn && (
              <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
                <NavItem href="/dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" />
                <NavItem href="/dashboard/leads" icon={<ClipboardList size={20} />} label="Leads" />
                <NavItem href="/dashboard/orders" icon={<Package size={20} />} label="Orders" />
                <NavItem href="/dashboard/partners" icon={<Handshake size={20} />} label="Partners" />
                <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
              </nav>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

/* Bottom nav item */
function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className="flex flex-col items-center text-xs text-gray-700">
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}
