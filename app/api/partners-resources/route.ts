// app/api/partners-resources/route.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("partner_resources")
    .select("*")
    .eq("is_active", true)
    .order("is_pinned", { ascending: false }) // 🔴 PIN FIRST
    .order("sort_order", { ascending: true }); // 🔴 THEN SORT

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
