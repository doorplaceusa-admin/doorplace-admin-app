import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q"); // search
    const sort = searchParams.get("sort") || "created_at";
    const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
    const limit = Number(searchParams.get("limit") || 50);

    let query = supabaseAdmin
      .from("receipts")
      .select(
        `
        id,
        image_url,
        vendor,
        total_amount,
        status,
        processed_at,
        created_at,
        parsed_items
        `
      )
      .order(sort, { ascending: dir === "asc" })
      .limit(limit);

    /* ============================
       SEARCH (vendor / text)
    ============================ */
    if (q) {
      query = query.or(
        `vendor.ilike.%${q}%,raw_text.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      receipts: data ?? [],
    });
  } catch (err) {
    console.error("RECEIPT LIST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load receipts" },
      { status: 500 }
    );
  }
}
