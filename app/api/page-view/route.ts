import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/* ======================================================
   CORS
====================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://doorplaceusa.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/* ======================================================
   CLEAN BOT DETECTION (SIMPLIFIED & ACCURATE)
====================================================== */
function detectCrawler(userAgent: string) {
  const ua = (userAgent || "").toLowerCase();

  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("headless") ||
    ua.includes("lighthouse") ||
    ua.includes("curl") ||
    ua.includes("wget") ||
    ua.includes("python") ||
    ua.includes("postman")
  ) {
    return "bot";
  }

  return null;
}

/* ======================================================
   POST /api/page-view
====================================================== */
export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin;

    /* ==========================
       1) Parse body
    ========================== */
    const body = await req.json();
    const { page_key, page_url, partner_id = null } = body;

    if (!page_key || !page_url) {
      return new Response("Missing page_key/page_url", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ==========================
       2) Get IP + UA
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

    /* ==========================
       3) REAL BROWSER CHECK (CRITICAL)
    ========================== */
    const isRealBrowser =
      ua.toLowerCase().includes("mozilla") &&
      ua.toLowerCase().includes("applewebkit");

    if (!isRealBrowser) {
      return new Response("Not real browser", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       4) Bot detection
    ========================== */
    const crawler = detectCrawler(ua);

    if (crawler) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`🤖 BOT BLOCKED: ${page_url} | IP: ${ip}`);
      }

      return new Response("Bot detected", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       5) Duplicate protection (RELAXED)
    ========================== */
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

    const { data: existing } = await supabase
      .from("page_view_events")
      .select("id")
      .eq("ip_address", ip)
      .eq("page_key", page_key)
      .gte("created_at", fiveSecondsAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`⚠️ DUPLICATE BLOCKED: ${ip}`);
      }

      return new Response("Duplicate", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       6) Geo data (Cloudflare)
    ========================== */
    const city = req.headers.get("cf-ipcity") || null;
    const state = req.headers.get("cf-region") || null;

    const lat = req.headers.get("cf-iplatitude")
      ? parseFloat(req.headers.get("cf-iplatitude")!)
      : null;

    const lon = req.headers.get("cf-iplongitude")
      ? parseFloat(req.headers.get("cf-iplongitude")!)
      : null;

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔥 HUMAN: ${page_url} | ${city}, ${state} | ${ip}`);
    }

    /* ==========================
       7) Insert into page_view_events
    ========================== */
    const { error } = await supabase.from("page_view_events").insert({
      page_key,
      page_url,
      partner_id,
      city,
      state,
      latitude: lat,
      longitude: lon,
      ip_address: ip,
      user_agent: ua,
      source: "human",
    });

    if (error) {
      console.error("❌ DB ERROR:", error);
      return new Response("DB Error", {
        status: 500,
        headers: corsHeaders,
      });
    }

    /* ==========================
       8) Update live map (CRITICAL)
    ========================== */
    await supabase
      .from("live_map_activity")
      .upsert(
        {
          ip_address: ip,
          page_key,
          page_url,
          city,
          state,
          latitude: lat,
          longitude: lon,
          is_human: true,
          last_seen: new Date().toISOString(),
        },
        {
          onConflict: "ip_address",
        }
      );

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error("❌ CRASH:", err);

    return new Response("Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
}