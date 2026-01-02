import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tradepilot.doorplaceusa.com";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token`);
  }

  const { data: partner } = await supabaseAdmin
    .from("partners")
    .select("id")
    .eq("email_verify_token", token)
    .maybeSingle();

  if (!partner) {
    return NextResponse.redirect(`${SITE_URL}/login?error=expired_token`);
  }

  await supabaseAdmin
    .from("partners")
    .update({
      email_verified: true,
      email_verify_token: null,
    })
    .eq("id", partner.id);

  return NextResponse.redirect(`${SITE_URL}/pending?verified=true`);
}
