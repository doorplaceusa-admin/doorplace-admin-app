"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Safe UUID generator
 * Works on iOS Safari, PWAs, older browsers
 */
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback (RFC4122 v4-style)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId() {
  if (typeof window === "undefined") return null;

  const key = "tp_live_session_id";
  let id = localStorage.getItem(key);

  if (!id) {
    id = generateUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

export function useLiveSession() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const session_id = getSessionId();
    if (!session_id) return;

    sessionIdRef.current = session_id;

    const upsertSession = async () => {
      await supabase.from("live_sessions").upsert(
        {
          session_id,
          page: window.location.pathname,
          user_agent: navigator.userAgent,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );
    };

    // initial ping
    upsertSession();

    // heartbeat every 15 seconds
    const interval = setInterval(upsertSession, 15000);

    return () => clearInterval(interval);
  }, []);
}
