import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";


export async function POST(req: Request) {
  const supabase = createClientHelper();
  const body = await req.json();

  const { commission_id } = body;

  if (!commission_id) {
    return NextResponse.json(
      { error: "Missing commission_id" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("commissions")
    .update({
      commission_status: "paid",
      payout_locked: true,
      payout_date: new Date().toISOString(),
    })
    .eq("id", commission_id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    commission_id,
  });
}
