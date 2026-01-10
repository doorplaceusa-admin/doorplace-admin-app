import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state_id = url.searchParams.get("state_id");
  const q = (url.searchParams.get("q") || "").trim();

  if (!state_id) {
    return NextResponse.json({ cities: [] });
  }

  let query = supabaseAdmin
    .from("us_locations")
    .select(`
      id,
      city_name,
      slug,
      population,
      state_id
    `)
    .eq("state_id", state_id)
    .order("population", { ascending: false })
    .limit(300);

  if (q) {
    query = query.ilike("city_name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ cities: data ?? [] });
}
