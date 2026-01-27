import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function refreshGoogleTokenIfNeeded(companyId: string) {
  // 1️⃣ Load stored tokens
  const { data: account, error } = await supabaseAdmin
    .from("google_oauth_accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("provider", "google")
    .single();

  if (error || !account) {
    throw new Error("Google account not connected");
  }

  // 2️⃣ Check expiration (5 min safety buffer)
  const expiresAt = new Date(account.expires_at);
  const now = new Date();

  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return account.access_token; // still valid
  }

  // 3️⃣ Refresh token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Google refresh error:", tokenData);
    throw new Error("Failed to refresh Google token");
  }

  // 4️⃣ Store new token + expiry
  const newExpiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString();

  await supabaseAdmin
    .from("google_oauth_accounts")
    .update({
      access_token: tokenData.access_token,
      expires_at: newExpiresAt,
    })
    .eq("id", account.id);

  return tokenData.access_token;
}
