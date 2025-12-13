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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setLoggedIn(!!data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setLoggedIn(!!session);
        if (!session) router.push("/login");
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) return null;

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex min-h-screen">
          {loggedIn && (
            <aside className="w-64 bg-white shadow p-6 flex flex-col">
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

          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
