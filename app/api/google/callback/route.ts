import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: "https://tradepilot.doorplaceusa.com/api/google/callback",
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Google token error:", tokenData);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }

  // 🔐 Calculate expiration
  const expiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString();

  // ⚠️ TEMP: hardcode company_id for now (OK for testing)
  // Replace this with session → user → company lookup later
  const companyId = "REPLACE_WITH_REAL_COMPANY_ID";

  // 💾 Store / update tokens
  const { error } = await supabaseAdmin
    .from("google_oauth_accounts")
    .upsert({
      company_id: companyId,
      provider: "google",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Failed to store Google tokens" },
      { status: 500 }
    );
  }

  console.log("✅ Google OAuth stored for company:", companyId);

  return NextResponse.redirect(
    "https://tradepilot.doorplaceusa.com/dashboard?google=connected"
  );
}
