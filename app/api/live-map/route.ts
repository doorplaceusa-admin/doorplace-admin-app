import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // last 30 min

    const { data, error } = await supabase
      .from("page_view_events")
      .select(`
        city,
        state,
        latitude,
        longitude,
        page_key,
        page_url
      `)
      .eq("resolved", true)
      .in("source", ["human", "verified_human"])
      .gte("created_at", since)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      console.error("❌ Map fetch error:", error);
      return new Response("Error", { status: 500 });
    }

    return Response.json(data || []);
  } catch (err) {
    console.error("❌ Map crash:", err);
    return new Response("Server error", { status: 500 });
  }
}