import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/* ======================================================
   CORS
====================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/* ======================================================
   BOT / CRAWLER DETECTOR
====================================================== */
function detectCrawler(userAgent: string, source: string) {
  const ua = (userAgent || "").toLowerCase();

  // Shopify internal traffic
  if (source === "shopify") return "shopify";

  // Major search engines
  if (ua.includes("googlebot")) return "googlebot";
  if (ua.includes("bingbot")) return "bingbot";
  if (ua.includes("duckduckbot")) return "duckduckbot";
  if (ua.includes("yandex")) return "yandexbot";
  if (ua.includes("baiduspider")) return "baiduspider";

  // SEO tools
  if (ua.includes("ahrefs")) return "ahrefs";
  if (ua.includes("semrush")) return "semrush";
  if (ua.includes("mj12bot")) return "mj12bot";

  // Generic crawler words
  if (ua.includes("crawler")) return "crawler";
  if (ua.includes("spider")) return "spider";

  // Safe "bot" match (prevents robot/bottom false hits)
  if (ua.includes(" bot") || ua.includes("bot/")) return "bot";

  return null;
}

/* ======================================================
   POST /api/page-view
====================================================== */
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();

    /* ============================================
       1) READ BODY
    ============================================ */
    const body = await req.json();

    const {
      page_key,
      page_url,
      partner_id = null,
      source = "unknown",
    } = body;

    if (!page_key || !page_url) {
      return new Response("Missing page_key/page_url", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ============================================
       2) USER AGENT + CLASSIFY
    ============================================ */
    const ua = req.headers.get("user-agent") || "";
    const crawler = detectCrawler(ua, source);

    /* ============================================
       3) BOT → LOG SEO EVENT (BLUE DOTS)
    ============================================ */
    if (crawler) {
      console.log("🔵 SEO BOT HIT:", crawler, page_url);

      // Minute bucket dedupe
      const view_bucket = new Date().toISOString().slice(0, 16);

      const { error: crawlError } = await supabase
        .from("seo_crawl_events")
        .insert({
          page_url,
          page_key,
          crawler,
          user_agent: ua,
          view_bucket,
        });

      if (crawlError) {
        console.error("❌ SEO BOT INSERT ERROR:", crawlError);
      }

      return new Response("Crawler logged", {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* ============================================
       4) GEO (HUMANS ONLY)
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
       5) HUMAN → LOG PAGE VIEW EVENT (GREEN DOTS)
    ============================================ */
    const { error: humanError } = await supabase
      .from("page_view_events")
      .insert({
        page_key,
        page_url,
        partner_id,
        source,
        city,
        state,
        latitude,
        longitude,
      });

    if (humanError) {
      console.error("❌ HUMAN INSERT ERROR:", humanError);

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
