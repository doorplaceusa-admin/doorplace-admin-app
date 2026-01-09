"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

function getSessionId() {
  const key = "tp_live_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function useLiveSession() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const session_id = getSessionId();
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
