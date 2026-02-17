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
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/* ======================================================
   BOT / CRAWLER DETECTOR (EXPANDED + SAFE)
====================================================== */
function detectCrawler(userAgent: string) {
  const ua = (userAgent || "").toLowerCase();

  /* -------------------------------
     Major Search Engine Crawlers
  -------------------------------- */
  if (ua.includes("googlebot")) return "googlebot";
  if (ua.includes("bingbot")) return "bingbot";
  if (ua.includes("duckduckbot")) return "duckduckbot";
  if (ua.includes("yandex")) return "yandexbot";
  if (ua.includes("baiduspider")) return "baiduspider";

  /* -------------------------------
     SEO Tools / Scrapers
  -------------------------------- */
  if (ua.includes("ahrefs")) return "ahrefs";
  if (ua.includes("semrush")) return "semrush";
  if (ua.includes("mj12bot")) return "mj12bot";

  /* -------------------------------
     Social + Link Preview Bots
     (These were being logged as HUMAN)
  -------------------------------- */
  if (ua.includes("facebookexternalhit")) return "facebook";
  if (ua.includes("facebot")) return "facebook";
  if (ua.includes("twitterbot")) return "twitter";
  if (ua.includes("slackbot")) return "slack";
  if (ua.includes("discordbot")) return "discord";
  if (ua.includes("linkedinbot")) return "linkedin";
  if (ua.includes("pinterest")) return "pinterest";

  /* -------------------------------
     Generic Bot Keywords
  -------------------------------- */
  if (ua.includes("crawler")) return "crawler";
  if (ua.includes("spider")) return "spider";

  if (ua.includes(" bot") || ua.includes("bot/")) return "bot";

  return null;
}


/* ======================================================
   POST /api/page-view
====================================================== */
export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin;

    /* ============================================
       1) BODY
    ============================================ */
    const body = await req.json();

    const { page_key, page_url, partner_id = null } = body;

    if (!page_key || !page_url) {
      return new Response("Missing page_key/page_url", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ============================================
       2) USER AGENT + BOT CHECK
    ============================================ */
    const ua = req.headers.get("user-agent") || "";
    const crawler = detectCrawler(ua);

    /* ============================================
       3) BOT → LOG SEO EVENT (CORRECT)
    ============================================ */
    if (crawler) {
      console.log("🔵 SEO BOT HIT:", crawler, page_url);
      /* ============================================
         CRAWLER LOGGING TOGGLE CHECK
      ============================================ */
      const { data: settings } = await supabase
        .from("system_settings")
        .select("crawl_logging_enabled")
        .limit(1)
        .maybeSingle();

      if (!settings?.crawl_logging_enabled) {
        console.log("🚫 Crawl logging disabled — skipping DB insert");

        return new Response("Crawler logging disabled", {
          status: 200,
          headers: corsHeaders,
        });
      }

      const view_bucket = new Date().toISOString();

      const { error } = await supabase.from("seo_crawl_events").insert({
        page_url,
        page_key,
        crawler,
        user_agent: ua,
        view_bucket,
      });

      if (error) {
        console.error("❌ SEO BOT INSERT ERROR:", error);
      }

      return new Response("Crawler logged", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ============================================
       4) HUMAN GEO (Cloudflare)
    ============================================ */
    let city: string | null = null;
    let state: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

    const cfCity = req.headers.get("cf-ipcity");

    if (cfCity) {
      city = cfCity;
      state = req.headers.get("cf-region");

      latitude = req.headers.get("cf-iplatitude")
        ? parseFloat(req.headers.get("cf-iplatitude")!)
        : null;

      longitude = req.headers.get("cf-iplongitude")
        ? parseFloat(req.headers.get("cf-iplongitude")!)
        : null;
    }

    console.log("🟢 HUMAN VIEW:", page_url, city, state);

    /* ============================================
       5) HUMAN → LOG EVENT
    ============================================ */
    const { error } = await supabase.from("page_view_events").insert({
      page_key,
      page_url,
      partner_id,
      city,
      state,
      latitude,
      longitude,
      source: "human",
    });

    if (error) {
      console.error("❌ HUMAN INSERT ERROR:", error);

      return new Response("DB error", {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("❌ ROUTE CRASH:", err);

    return new Response("Server crash", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
