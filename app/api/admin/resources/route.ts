import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* GET ALL RESOURCES */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("partner_resources")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/* CREATE RESOURCE */
export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabaseAdmin
    .from("partner_resources")
    .insert([body]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
