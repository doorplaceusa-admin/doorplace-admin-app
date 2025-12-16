import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabaseServer";



const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("partners")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await resend.emails.send({
    from: "Doorplace USA <no-reply@doorplaceusa.com>",
    to: process.env.ADMIN_EMAIL!,
    subject: "New Partner Onboarded",
    html: `
      <h2>New Partner Signup</h2>
      <p><b>Name:</b> ${data.first_name} ${data.last_name}</p>
      <p><b>Email:</b> ${data.email_address}</p>
      <p><b>Phone:</b> ${data.cell_phone_number}</p>
      <p><b>Partner ID:</b> ${data.partner_id}</p>
      <p><b>Coverage Area:</b> ${data.coverage_area}</p>
    `,
  });

  return NextResponse.json({ success: true });
}
