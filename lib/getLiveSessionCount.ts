import { supabase } from "@/lib/supabaseClient";

export async function getLiveSessionCount(): Promise<number> {
  const { data, error } = await supabase
    .from("live_session_count")
    .select("total_live")
    .single();

  if (error || !data) return 0;
  return data.total_live ?? 0;
}
