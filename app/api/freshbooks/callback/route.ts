import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.FRESHBOOKS_CLIENT_ID!;
  const clientSecret = process.env.FRESHBOOKS_CLIENT_SECRET!;
  const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI!;

  const tokenRes = await fetch("https://api.freshbooks.com/auth/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const json = await tokenRes.json();
  if (!tokenRes.ok) {
    return NextResponse.json({ error: json }, { status: 400 });
  }

  // TODO: save json.access_token + json.refresh_token in Supabase
  return NextResponse.json({ ok: true, tokens: json });
}
