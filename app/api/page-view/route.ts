import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { broadcastCrawler } from "@/lib/liveCrawlerBus";
import crypto from "crypto";

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
   BOT / CRAWLER DETECTOR (FINAL + HARDENED)
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
  -------------------------------- */
  if (ua.includes("facebookexternalhit")) return "facebook";
  if (ua.includes("facebot")) return "facebook";
  if (ua.includes("twitterbot")) return "twitter";
  if (ua.includes("slackbot")) return "slack";
  if (ua.includes("discordbot")) return "discord";
  if (ua.includes("linkedinbot")) return "linkedin";
  if (ua.includes("pinterest")) return "pinterest";

  /* -------------------------------
     Messaging Preview Bots
  -------------------------------- */
  if (ua.includes("whatsapp")) return "whatsapp";
  if (ua.includes("telegrambot")) return "telegram";
  if (ua.includes("skypeuripreview")) return "skype";
  if (ua.includes("applebot")) return "applebot";

  /* -------------------------------
     Headless + Auditing Tools
  -------------------------------- */
  if (ua.includes("headless")) return "headless";
  if (ua.includes("lighthouse")) return "lighthouse";
  if (ua.includes("chrome-lighthouse")) return "lighthouse";

  /* -------------------------------
     Generic Bot Keywords
  -------------------------------- */
  if (ua.includes("crawler")) return "crawler";
  if (ua.includes("spider")) return "spider";

  if (ua.includes(" bot") || ua.includes("bot/")) return "bot";

  return null;
}

/* ======================================================
   POST /api/page-view  (FINAL LOCKED VERSION)
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
       2) USER AGENT + IP + BOT CHECK
    ============================================ */
    const ua = req.headers.get("user-agent") || "";

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    const crawler = detectCrawler(ua);

    console.log("🔎 VIEW CHECK:", {
      crawler: crawler || "human",
      page_url,
      ip,
    });

    /* ============================================
       3) BOT → SEO CRAWL EVENT ONLY (NEVER HUMAN)
    ============================================ */
    /* ============================================
   3) BOT → LIVE ONLY (NO DATABASE WRITES)
============================================ */
if (crawler) {
  console.log("🔵 LIVE SEO BOT HIT:", crawler, page_url);

  // ✅ LIVE MAP BROADCAST (NO DATABASE)
  broadcastCrawler({
    id: crypto.randomUUID(),
    source: "crawler",
    city: null,
    state: "US",
    latitude: 39.8283,
    longitude: -98.5795,
    crawler_name: crawler,
    page_url,
    page_key,
    count: 1,
  });

  return new Response("Crawler detected (live only)", {
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

    console.log("🔥 HUMAN VIEW:", page_url, city, state);

    /* ============================================
       5) HUMAN → INSERT REAL PAGE VIEW
    ============================================ */
    const { error } = await supabase.from("page_view_events").insert({
      page_key,
      page_url,
      partner_id,
      city,
      state,
      latitude,
      longitude,
      ip_address: ip,
      user_agent: ua,
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
