"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * Global App View Tracker
 * -----------------------
 * Logs every route change into app_view_logs.
 * Safe for Admin + Partner layouts.
 */
export function useAppViewTracker(options: {
  role: "admin" | "partner" | "unknown";
  companyId?: string | null;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const trackView = async () => {
      const SESSION_KEY = "tp_app_session_id";

      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }

      await supabase.from("app_view_logs").insert({
        page_path: pathname,
        session_id: sessionId,
        user_role: options.role,
        company_id: options.companyId ?? null,
      });
    };

    trackView();
  }, [pathname]);
}
