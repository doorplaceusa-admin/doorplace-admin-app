import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stateIds: string[] = body.state_ids;

    if (!stateIds?.length) {
      return NextResponse.json(
        { error: "No states provided" },
        { status: 400 }
      );
    }

    let allCityIds: string[] = [];
    let from = 0;
    let to = 999;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from("us_locations")
        .select("id")
        .in("state_id", stateIds)
        .range(from, to);

      if (error) throw error;

      allCityIds.push(...data.map((c) => c.id));

      // ✅ Stop when fewer than 1000 returned
      if (data.length < 1000) {
        hasMore = false;
      } else {
        from += 1000;
        to += 1000;
      }
    }

    return NextResponse.json({
      city_ids: allCityIds,
      total: allCityIds.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
