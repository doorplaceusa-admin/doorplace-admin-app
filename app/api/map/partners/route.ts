import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  // ✅ Pull directly from your real partners table
  const { data, error } = await supabaseAdmin
    .from("partners")
    .select("city,state");

  if (error) {
    console.error("Partner coverage API error:", error);
    return Response.json([]);
  }

  // ✅ Clean + normalize partner locations
  const cleaned = (data || [])
    .filter((p) => p.city && p.state)
    .map((p) => ({
      city: String(p.city).trim(),
      state: String(p.state).trim().toUpperCase(),
    }));

  // ✅ Group by city/state into coverage counts
  const grouped = new Map<string, number>();

  for (const p of cleaned) {
    const key = `${p.city},${p.state}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  // ✅ Convert grouped results into coverage objects
  const coverage = Array.from(grouped.entries()).map(([key, count]) => {
    const [city, state] = key.split(",");

    return {
      city,
      state,
      partner_count: count,

      // ⚠️ No lat/lng yet (map will fallback)
      latitude: null,
      longitude: null,
    };
  });

  return Response.json(coverage);
}
