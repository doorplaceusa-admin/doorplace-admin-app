import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/* ======================================================
   CORS
====================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://doorplaceusa.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/* ======================================================
   POST /api/engagement
====================================================== */
export async function POST(req: Request) {
  try {
    /* ==========================
       GLOBAL LOGGING (ALWAYS)
    ========================== */
    const rawIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      "";

    const ip = rawIp.split(",")[0]?.trim() || null;
    const ua = req.headers.get("user-agent") || "";

    console.log("🔥 ENGAGEMENT HIT");
    console.log("IP:", ip);
    console.log("UA:", ua);

    const supabase = supabaseAdmin;

    if (!ip) {
      return new Response("No IP", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       Browser check (LOG ONLY)
    ========================== */
    const isRealBrowser =
      ua.toLowerCase().includes("mozilla") &&
      ua.toLowerCase().includes("applewebkit");

    if (!isRealBrowser) {
      console.log("⚠️ Not real browser");
    }

    /* ==========================
       Get body
    ========================== */
    const body = await req.json();
    const { page_key, partner_id } = body;

    const safePartnerId = partner_id || null;

    if (!page_key) {
      return new Response("Missing data", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ==========================
       Time window (20 sec)
    ========================== */
    const windowTime = new Date(Date.now() - 20000).toISOString();

    /* ==========================
       Find latest matching view
    ========================== */
    const { data: latest, error: fetchError } = await supabase
      .from("page_view_events")
      .select("id")
      .eq("ip_address", ip)
      .eq("page_key", page_key)
      .gte("created_at", windowTime)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !latest) {
      console.log("⚠️ No matching view — skipping update");

      return new Response("No match", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       Mark as verified human
    ========================== */
    const { error: updateError } = await supabase
      .from("page_view_events")
      .update({
        source: "verified_human",
        partner_id: safePartnerId,
      })
      .eq("id", latest.id);

    if (updateError) {
      console.error("❌ Engagement update error:", updateError);
      return new Response("DB Error", {
        status: 500,
        headers: corsHeaders,
      });
    }

    /* ==========================
       Update live map
    ========================== */
    const { data: geoRow } = await supabase
      .from("page_view_events")
      .select("city, state, latitude, longitude, page_key, page_url")
      .eq("id", latest.id)
      .single();

    const { error: liveMapError } = await supabase
      .from("live_map_activity")
      .update({
        is_human: true,
        source: "human",
        last_seen: new Date().toISOString(),
        city: geoRow?.city || null,
        state: geoRow?.state || "",
        latitude: geoRow?.latitude || null,
        longitude: geoRow?.longitude || null,
        page_key: geoRow?.page_key || "",
        page_url: geoRow?.page_url || "",
      })
      .eq("ip_address", ip);

    if (liveMapError) {
      console.error("❌ Live map update error:", liveMapError);
    }

    /* ==========================
       Final log
    ========================== */
    console.log(`👤 VERIFIED HUMAN: ${page_key} | IP: ${ip}`);

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error("❌ Engagement crash:", err);

    return new Response("Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
}