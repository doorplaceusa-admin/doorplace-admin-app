import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const receipt_id = searchParams.get("receipt_id");

  if (!receipt_id) {
    return NextResponse.json({ error: "receipt_id required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("receipt_items")
    .select("*")
    .eq("receipt_id", receipt_id)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }

  return NextResponse.json(data);
}
