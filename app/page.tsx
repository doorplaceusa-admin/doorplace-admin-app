"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUnknownPresence } from "@/lib/useUnknownPresence";
import { useAppViewTracker } from "@/lib/useAppViewTracker";

export default function Home() {
  const router = useRouter();

  // Presence + analytics still run
  useUnknownPresence("home");

  useAppViewTracker({
    role: "unknown",
    companyId: null,
  });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;

      if (data.session) {
        // ✅ Logged in → go straight to app
        router.replace("/dashboard"); // change if your route is different
      } else {
        // ✅ Not logged in → go straight to login
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Prevents landing page flash
  return null;
}
