"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        setLoggedIn(!!data.session);
        setLoading(false);

        if (!data.session) {
          router.replace("/login");
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setLoggedIn(!!session);

        if (!session) {
          router.replace("/login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
          {loggedIn && (
            <aside
              className={`${
                sidebarOpen ? "w-64" : "w-16"
              } bg-white shadow p-4 flex flex-col transition-all duration-300`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                {sidebarOpen && (
                  <h1 className="text-xl font-bold text-red-700">
                    Admin
                  </h1>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-600 hover:text-black"
                >
                  ☰
                </button>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-3 text-sm">
                <Link href="/dashboard">📊 {sidebarOpen && "Dashboard"}</Link>
                <Link href="/dashboard/companies">🏢 {sidebarOpen && "Companies"}</Link>
                <Link href="/dashboard/leads">📋 {sidebarOpen && "Leads"}</Link>
                <Link href="/dashboard/partners">🤝 {sidebarOpen && "Partners"}</Link>
                <Link href="/dashboard/orders">📦 {sidebarOpen && "Orders"}</Link>
                <Link href="/dashboard/commissions">💰 {sidebarOpen && "Commissions"}</Link>
                <Link href="/dashboard/settings">⚙️ {sidebarOpen && "Settings"}</Link>
              </nav>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="mt-auto bg-red-600 text-white py-2 rounded text-sm"
              >
                {sidebarOpen ? "Log out" : "⎋"}
              </button>
            </aside>
          )}

          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
