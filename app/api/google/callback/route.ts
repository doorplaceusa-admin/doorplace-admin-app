import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    /**
     * 1️⃣ Exchange auth code for tokens
     */
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
      return NextResponse.json(tokenData, { status: tokenRes.status });
    }

    /**
     * 2️⃣ Calculate expiration timestamp
     */
    const expiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000
    ).toISOString();

    /**
     * 3️⃣ Resolve company_id (TEMP hardcoded – OK for now)
     * TODO: replace with session → user → company lookup later
     */
    const companyId = "88c22910-7bd1-42fc-bc81-8144a50d7b41";

    /**
     * 4️⃣ Preserve refresh_token (Google only sends it once)
     */
    const { data: existing } = await supabaseAdmin
      .from("google_oauth_accounts")
      .select("refresh_token")
      .eq("company_id", companyId)
      .eq("provider", "google")
      .single();

    const refreshToken =
      tokenData.refresh_token ?? existing?.refresh_token ?? null;

    /**
     * 5️⃣ Store / update OAuth tokens
     */
    const { error } = await supabaseAdmin
      .from("google_oauth_accounts")
      .upsert({
        company_id: companyId,
        provider: "google",
        access_token: tokenData.access_token,
        refresh_token: refreshToken,
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

    console.log("✅ Google OAuth connected for company:", companyId);

    /**
     * 6️⃣ Redirect back to dashboard
     */
    return NextResponse.redirect(
      "https://tradepilot.doorplaceusa.com/dashboard?google=connected"
    );
  } catch (err) {
    console.error("OAuth callback crash:", err);
    return NextResponse.json(
      { error: "Google OAuth callback failed" },
      { status: 500 }
    );
  }
}
