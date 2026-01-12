import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PAGE_SIZE = 1000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state_id = url.searchParams.get("state_id");
  const q = (url.searchParams.get("q") || "").trim();
  const page = parseInt(url.searchParams.get("page") || "0");

  if (!state_id) {
    return NextResponse.json({ cities: [] });
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from("us_locations")
    .select(
      `
      id,
      city_name,
      slug,
      population,
      latitude,
      longitude
    `
    )
    .eq("state_id", state_id)
    .order("population", { ascending: false })
    .range(from, to);

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

  return NextResponse.json({
    cities: data || [],
    page,
    page_size: PAGE_SIZE,
    count: data?.length || 0,
  });
}
