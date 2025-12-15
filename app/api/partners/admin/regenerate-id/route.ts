import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function generatePartnerID() {
  return "DP" + Math.floor(1000000 + Math.random() * 9000000);
}

export async function POST(req: Request) {
  try {
    const { email_address } = await req.json();

    if (!email_address) {
      return NextResponse.json({ error: "email_address required" }, { status: 400 });
    }

    const partner_id = generatePartnerID();
    const tracking_link = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partner_id}`;

    const { data, error } = await supabaseAdmin
      .from("partners")
      .update({
        partner_id,
        tracking_link,
      })
      .eq("email_address", email_address.toLowerCase())
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: "regenerated",
      partner_id: data.partner_id,
      tracking_link: data.tracking_link,
    });

  } catch (err) {
    console.error("REGEN ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
