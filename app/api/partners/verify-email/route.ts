import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", req.url)
    );
  }

  const { data: partner } = await supabaseAdmin
    .from("partners")
    .select("id")
    .eq("email_verify_token", token)
    .maybeSingle();

  if (!partner) {
    return NextResponse.redirect(
      new URL("/login?error=expired_token", req.url)
    );
  }

  await supabaseAdmin
    .from("partners")
    .update({
      email_verified: true,
      email_verify_token: null,
    })
    .eq("id", partner.id);

  return NextResponse.redirect(new URL("/pending", req.url));
}
