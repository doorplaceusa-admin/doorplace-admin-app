import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { refreshGoogleTokenIfNeeded } from "@/lib/google/refreshGoogleToken";

const GOOGLE_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

export async function POST() {
  try {
    /**
     * 1️⃣ Load Google OAuth record
     */
    const { data: oauth, error: oauthError } = await supabaseAdmin
      .from("google_oauth_accounts")
      .select("company_id")
      .eq("provider", "google")
      .single();

    if (oauthError || !oauth) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 401 }
      );
    }

    const companyId = oauth.company_id;

    /**
     * 2️⃣ Get VALID access token (auto-refresh)
     */
    const accessToken = await refreshGoogleTokenIfNeeded(companyId);

    /**
     * 3️⃣ Fetch Search Console sites
     */
    const sitesRes = await fetch(`${GOOGLE_API_BASE}/sites`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const sitesData = await sitesRes.json();

    if (!sitesRes.ok) {
      console.error("Sites error:", sitesData);
      return NextResponse.json(
        { error: "Failed to fetch sites" },
        { status: 500 }
      );
    }

    const sites = sitesData.siteEntry || [];

    /**
     * 4️⃣ Store sites (idempotent)
     */
    for (const site of sites) {
      await supabaseAdmin.from("google_sites").upsert(
        {
          company_id: companyId,
          site_url: site.siteUrl,
          permission_level: site.permissionLevel,
        },
        {
          onConflict: "company_id,site_url",
        }
      );
    }

    /**
     * 5️⃣ Date range (last 28 days)
     */
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(
      Date.now() - 28 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);

    /**
     * 6️⃣ Fetch & store performance data
     */
    for (const site of sites) {
      const perfRes = await fetch(
        `${GOOGLE_API_BASE}/sites/${encodeURIComponent(
          site.siteUrl
        )}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["page", "query"],
            rowLimit: 25000,
          }),
        }
      );

      const perfData = await perfRes.json();

      if (!perfRes.ok) {
        console.error("Performance error:", perfData);
        continue;
      }

      const rows = perfData.rows || [];

      for (const row of rows) {
        const [page, query] = row.keys;

        await supabaseAdmin.from("google_search_console_daily").insert({
          company_id: companyId,
          site_url: site.siteUrl,
          page,
          query,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          date: endDate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sites: sites.length,
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Sync crash:", err);
    return NextResponse.json(
      { error: "Google sync failed" },
      { status: 500 }
    );
  }
}
