"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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

  if (loading) return null;

  // *** IMPORTANT: NO ADDITIONAL WRAPPERS, NO HEADERS, NO FOOTERS ***
  return <>{children}</>;
}