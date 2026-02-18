import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  let minutes = parseInt(url.searchParams.get("minutes") || "30");

  // Clamp: 1 min → 24 hours
  minutes = Math.max(1, Math.min(minutes, 1440));

  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("page_view_events")
    .select("id", { count: "exact", head: true })
    .eq("source", "human")
    .gte("created_at", cutoff);

  if (error) {
    console.error("Human count error:", error);
    return Response.json({ count: 0, minutes });
  }

  return Response.json({
    count: count ?? 0,
    minutes,
  });
}
