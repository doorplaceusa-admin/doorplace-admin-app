"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUnknownPresence(page: string) {
  useEffect(() => {
    const channel = supabase.channel("tradepilot-presence",{
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      // no-op, dashboard reads aggregated presence
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          role: "unknown",
          page,
          ts: Date.now(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page]);
}
