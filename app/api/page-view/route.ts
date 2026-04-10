import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

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
   HARDENED BOT DETECTOR (DOORPLACE MASTER LIST)
====================================================== */
function detectCrawler(userAgent: string, ip: string | null) {
  const ua = (userAgent || "").toLowerCase();
  
  if (ip) {
    // Standard Search Engines
    if (ip.startsWith("66.249.")) return "googlebot";
    if (ip.startsWith("157.55.") || ip.startsWith("40.77.")) return "bingbot";
    if (ip.startsWith("17.")) return "applebot";

    // DOORPLACE MASTER BLACKLIST (Data Centers & Scrapers caught in logs)
    const badPrefixes = {
      "192.144.": "tencent-bot",      // Caught: 192.144.88.116
      "104.253.": "zayo-bot",         // Caught: 104.253.252.13
      "103.75.":  "digitalocean-bot", // Caught: 103.75.221.90
      "104.222.": "zayo-infrastructure",// Caught: 104.222.171.136
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

  // Fallback for keyword-based bots
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider") || ua.includes("headless") || ua.includes("headlesschrome")) {
    return "generic-bot";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { page_key, page_url, partner_id = null } = body;

    // Hardened IP Detection
    const rawIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
    const ip = rawIp.split(',')[0].trim() || null;
    const ua = req.headers.get("user-agent") || "";

    const crawler = detectCrawler(ua, ip);

    /* --- 1. BOT HANDLING (TERMINAL ONLY) --- */
    if (crawler) {
      console.log(`🤖 BOT BLOCKED: [${crawler}] | URL: ${page_url} | IP: ${ip}`);
      return new Response("Bot detected", { status: 200, headers: corsHeaders });
    }

    /* --- 2. HUMAN HANDLING (DATABASE + TERMINAL) --- */
    const city = req.headers.get("cf-ipcity") || null;
    const state = req.headers.get("cf-region") || null;

    console.log(`✅ VERIFIED HUMAN: ${page_url} | IP: ${ip} | Location: ${city}, ${state}`);

    const { error } = await supabaseAdmin.from("page_view_events").insert({
      page_key,
      page_url,
      partner_id,
      city,
      state,
      ip_address: ip,
      user_agent: ua,
      source: "human",
    });

    if (error) console.error("❌ DB ERROR:", error);

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("❌ CRASH:", err);
    return new Response("Server Error", { status: 500, headers: corsHeaders });
  }
}