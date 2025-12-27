import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.FRESHBOOKS_CLIENT_ID!;
  const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI!;
  const scope = encodeURIComponent([
    "user:profile:read",
    "user:invoices:read",
    "user:invoices:write",
  ].join(" "));

  // optional but recommended
  const state = crypto.randomUUID();

  const url =
    `https://my.freshbooks.com/service/auth/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(url);
}
