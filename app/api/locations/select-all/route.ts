import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const allIds: string[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("us_locations")
      .select("id")
      .range(from, from + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) break;

    allIds.push(...data.map((r) => r.id));

    if (data.length < pageSize) break;

    from += pageSize;
  }

  return NextResponse.json({ city_ids: allIds });
}
 