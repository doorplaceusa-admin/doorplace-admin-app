import { supabaseAdmin } from "@/lib/supabaseAdmin";



export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("partner_city_coverage")
    .select("city,state,partner_count,latitude,longitude");

  if (error) {
    console.error("Partner coverage API error:", error);
    return Response.json([]);
  }

  return Response.json(data || []);
}
