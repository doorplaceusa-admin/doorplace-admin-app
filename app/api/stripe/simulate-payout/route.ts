import { NextResponse } from "next/server";
import { createClientHelper } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = createClientHelper();
  const body = await req.json();

  const {
    commission_id,
    simulated_stripe_payout_id = "SIM_" + Math.random().toString(36).slice(2),
  } = body;

  if (!commission_id) {
    return NextResponse.json(
      { error: "Missing commission_id" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("commissions")
    .update({
      stripe_payout_id: simulated_stripe_payout_id,
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
    simulated_stripe_payout_id,
  });
}
