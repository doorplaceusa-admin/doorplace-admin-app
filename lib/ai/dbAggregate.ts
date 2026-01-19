// lib/ai/dbAggregate.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getTableStats(table: string) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    return { table, count: null, error: error.message };
  }

  return { table, count };
}

