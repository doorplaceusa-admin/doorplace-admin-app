// app/api/freshbooks/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const clientId = process.env.FRESHBOOKS_CLIENT_ID!;
    const clientSecret = process.env.FRESHBOOKS_CLIENT_SECRET!;
    const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI!;

    /* ===============================
       EXCHANGE CODE FOR TOKENS
    =============================== */
    const tokenRes = await fetch(
      "https://api.freshbooks.com/auth/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    const json = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "Token exchange failed", details: json },
        { status: 400 }
      );
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      token_type,
    } = json;

    if (!access_token || !refresh_token || !expires_in) {
      return NextResponse.json(
        { error: "Invalid token response", json },
        { status: 500 }
      );
    }

    const expires_at = new Date(
      Date.now() + expires_in * 1000
    ).toISOString();

    /* ===============================
       SINGLE SOURCE OF TRUTH
    =============================== */
    await supabaseAdmin
      .from("freshbooks_tokens")
      .delete()
      .neq("id", "");

    const { error: insertError } = await supabaseAdmin
      .from("freshbooks_tokens")
      .insert({
        access_token,
        refresh_token,
        token_type: token_type || "Bearer",
        expires_at,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save token", details: insertError },
        { status: 500 }
      );
    }

    /* ===============================
       SUCCESS REDIRECT
    =============================== */
    return NextResponse.redirect(
      new URL("/dashboard/invoices?auth=success", req.url)
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Callback error" },
      { status: 500 }
    );
  }
}
