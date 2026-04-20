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
    const supabase = supabaseAdmin;

    /* ==========================
       1) Get IP + UA
    ========================== */
    const rawIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      "";

    const ip = rawIp.split(",")[0]?.trim() || null;

    if (!ip) {
      return new Response("No IP", {
        status: 200,
        headers: corsHeaders,
      });
    }

    const ua = req.headers.get("user-agent") || "";
    const secChUa = req.headers.get("sec-ch-ua");

    /* ==========================
       2) STRONG BROWSER CHECK
    ========================== */
    const isRealBrowser =
      ua.toLowerCase().includes("mozilla") &&
      ua.toLowerCase().includes("applewebkit") &&
      !!secChUa;

    if (!isRealBrowser) {
      return new Response("Not real browser", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       3) Get body
    ========================== */
    const body = await req.json();
    const { page_key, partner_id } = body;

    if (!page_key) {
      return new Response("Missing data", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ==========================
       4) Time window (20 sec)
    ========================== */
    const windowTime = new Date(Date.now() - 20000).toISOString();

    /* ==========================
       5) Find latest matching view
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
      if (process.env.NODE_ENV !== "production") {
        console.log("⚠️ No matching view:", ip);
      }

      return new Response("No match", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       6) Mark as verified human (page_view_events)
    ========================== */
    const { error: updateError } = await supabase
      .from("page_view_events")
      .update({
  source: "verified_human",
  partner_id: partner_id || null, // 🔥 THIS IS THE FIX
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
       7) Update live map (IMPORTANT)
    ========================== */
    const { error: liveMapError } = await supabase
      .from("live_map_activity")
      .update({
        is_human: true,
        source: "human", // ✅ critical for filtering
        last_seen: new Date().toISOString(),
      })
      .eq("ip_address", ip);

    if (liveMapError) {
      console.error("❌ Live map update error:", liveMapError);
    }

    /* ==========================
       8) Logging (dev only)
    ========================== */
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔥 VERIFIED HUMAN: ${page_key} | IP: ${ip}`);
    }

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