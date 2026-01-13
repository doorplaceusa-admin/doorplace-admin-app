import { supabase } from "@/lib/supabaseClient";

export async function getLiveSessionCount(): Promise<number> {
  const cutoff = new Date(Date.now() - 30000).toISOString(); // 30s heartbeat

  const { count, error } = await supabase
    .from("live_sessions")
    .select("*", { count: "exact", head: true })
    .gte("last_seen", cutoff);

  if (error) return 0;
  return count ?? 0;
}
