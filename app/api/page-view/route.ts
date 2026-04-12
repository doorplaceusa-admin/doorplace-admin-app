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
   STRONG BOT DETECTION (BEST VERSION)
====================================================== */
function detectCrawler(userAgent: string, ip: string | null) {
  const ua = (userAgent || "").toLowerCase();

  // Script / tool detection
  if (
    ua.includes("python") ||
    ua.includes("curl") ||
    ua.includes("wget") ||
    ua.includes("axios") ||
    ua.includes("postman")
  ) {
    return "script-bot";
  }

  if (ip) {
    // Major crawlers
    if (ip.startsWith("66.249.")) return "googlebot";
    if (ip.startsWith("157.55.") || ip.startsWith("40.77.")) return "bingbot";
    if (ip.startsWith("17.")) return "applebot";

    // Data center / scraper IPs
    const badPrefixes: Record<string, string> = {
      "192.144.": "tencent-bot",
      "104.253.": "zayo-bot",
      "103.75.":  "digitalocean-bot",
      "104.222.": "zayo-infrastructure",
      "192.227.": "colocrossing-bot",
      "45.38.":   "constant-choopa-bot",
      "104.243.": "leaseweb-bot",
      "178.171.": "azerconnect-bot",
      "209.20.":  "hivelocity-bot",
      "106.49.":  "china-unicom-bot",
      "190.106.": "columbus-bot",
      "198.13.":  "vultr-bot",
      "161.123.": "m247-bot",
      "92.255.":  "gcore-bot",
      "198.85.":  "tierpoint-bot",
      "206.204.": "netease-bot",
      "185.152.": "datacamp-bot",
      "209.139.": "cogent-bot"
    };

    for (const [prefix, name] of Object.entries(badPrefixes)) {
      if (ip.startsWith(prefix)) return name;
    }
  }

  // Fallback UA detection
  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("headless") ||
    ua.includes("headlesschrome") ||
    ua.includes("lighthouse")
  ) {
    return "generic-bot";
  }

  return null;
}

/* ======================================================
   POST /api/page-view
====================================================== */
export async function POST(req: Request) {
  console.log("🔥 HIT API");

  try {
    const supabase = supabaseAdmin;

    /* ==========================
       1) Parse body
    ========================== */
    const body = await req.json();
    const { page_key, page_url, partner_id = null } = body;

    if (!page_key || !page_url) {
      console.log("❌ Missing page_key/page_url");
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
    const ua = req.headers.get("user-agent") || "";

    console.log("🌐 REQUEST:", { ip, ua, page_url });

    if (!ip) {
      console.log("⚠️ No IP detected");
      return new Response("No IP", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       3) Bot detection
    ========================== */
    const crawler = detectCrawler(ua, ip);

    if (crawler) {
      console.log(`🤖 BOT BLOCKED: [${crawler}] | ${page_url} | IP: ${ip}`);
      return new Response("Bot detected", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       4) Duplicate protection (10 sec)
    ========================== */
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

    const { data: existing } = await supabase
      .from("page_view_events")
      .select("id")
      .eq("ip_address", ip)
      .eq("page_key", page_key)
      .gte("created_at", tenSecondsAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⚠️ DUPLICATE BLOCKED: ${ip}`);
      return new Response("Duplicate", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ==========================
       5) Geo data
    ========================== */
    const city = req.headers.get("cf-ipcity") || null;
    const state = req.headers.get("cf-region") || null;

    const lat = req.headers.get("cf-iplatitude")
      ? parseFloat(req.headers.get("cf-iplatitude")!)
      : null;

    const lon = req.headers.get("cf-iplongitude")
      ? parseFloat(req.headers.get("cf-iplongitude")!)
      : null;

    console.log(`🔥 HUMAN VISITOR: ${page_url} | ${city}, ${state} | IP: ${ip}`);

    /* ==========================
       6) Insert into DB
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

    console.log("✅ DB INSERT SUCCESS");

    /* ==========================
       7) Live map update
    ========================== */
    await supabase.from("live_map_activity").upsert(
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

    console.log("🗺️ LIVE MAP UPDATED");

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