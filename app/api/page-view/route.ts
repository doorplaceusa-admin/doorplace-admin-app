import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  console.log("🔥 PAGE VIEW HIT");

  try {
    const supabase = createSupabaseServerClient();

    // ======================================================
    // ✅ 1. BOT DETECTION (STOP GOOGLE INDEXING SPAM)
    // ======================================================
   
const ua = (req.headers.get("user-agent") || "").toLowerCase();

    const isBot =
      ua.includes("Googlebot") ||
      ua.includes("bingbot") ||
      ua.includes("AhrefsBot") ||
      ua.includes("SemrushBot") ||
      ua.includes("DuckDuckBot") ||
      ua.includes("YandexBot") ||
      ua.includes("MJ12bot") ||
      ua.includes("crawler") ||
      ua.includes("spider");
      ua.includes("googlebot")


    if (isBot) {
      console.log("🤖 BOT SKIPPED:", ua);
      return new Response("Bot skipped", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ======================================================
    // ✅ 2. READ BODY
    // ======================================================
    const body = await req.json();

    const { page_key, page_url, partner_id = null, source = "unknown" } = body;

    if (!page_key || !page_url) {
      return new Response("Missing page_key/page_url", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ======================================================
    // ✅ 3. THROTTLE DUPLICATES (1 VIEW PER 10 MINUTES)
    // ======================================================
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: recentHit } = await supabase
      .from("page_view_events")
      .select("id")
      .eq("page_url", page_url)
      .eq("partner_id", partner_id)
      .gte("created_at", tenMinutesAgo)
      .limit(1)
      .maybeSingle();

    if (recentHit) {
      console.log("⏳ DUPLICATE VIEW SKIPPED:", page_url);
      return new Response("Duplicate skipped", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ======================================================
    // ✅ SAFE DEFAULTS (NO CLOUDFLARE REQUIRED)
    // ======================================================
    let city = null;
    let state = null;
    let latitude = null;
    let longitude = null;

    if (req.headers.get("cf-ipcity")) {
      city = req.headers.get("cf-ipcity");
      state = req.headers.get("cf-region");

      latitude = req.headers.get("cf-iplatitude")
        ? parseFloat(req.headers.get("cf-iplatitude")!)
        : null;

      longitude = req.headers.get("cf-iplongitude")
        ? parseFloat(req.headers.get("cf-iplongitude")!)
        : null;
    }

    console.log("📍 GEO:", { city, state, latitude, longitude });

    // ======================================================
    // ✅ 4. INSERT EVENT (REAL VISITOR ONLY)
    // ======================================================
    const { error } = await supabase.from("page_view_events").insert({
      page_key,
      page_url,
      partner_id,
      source,
      city,
      state,
      latitude,
      longitude,
    });

    if (error) {
      console.error("❌ INSERT ERROR:", error);
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("❌ ROUTE CRASH:", err);
    return new Response("Server crash", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
