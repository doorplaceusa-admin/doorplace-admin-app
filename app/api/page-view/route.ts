import { createSupabaseServerClient } from "@/lib/supabaseServer";

const supabase = createSupabaseServerClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  console.log("🔥 PAGE VIEW ROUTE HIT (LIVE)");

  try {
    const body = await req.json();

    const {
      page_key,
      page_url,
      partner_id = null,
      source = "unknown",
    } = body;

    if (!page_key || !page_url) {
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ============================================
       ✅ CLOUDFARE GEOLOCATION HEADERS
    ============================================ */

    const city = req.headers.get("cf-ipcity") || null;
    const state = req.headers.get("cf-region") || null;

    const latitude = req.headers.get("cf-iplatitude")
      ? parseFloat(req.headers.get("cf-iplatitude")!)
      : null;

    const longitude = req.headers.get("cf-iplongitude")
      ? parseFloat(req.headers.get("cf-iplongitude")!)
      : null;

    const country = req.headers.get("cf-ipcountry") || null;
    const ip = req.headers.get("cf-connecting-ip") || null;

    console.log("📍 GEO FOUND:", {
      ip,
      city,
      state,
      latitude,
      longitude,
      country,
    });

    /* ============================================
       ✅ INSERT FULL EVENT
    ============================================ */

    const { error } = await supabase.from("page_view_events").insert({
      page_key,
      page_url,
      partner_id,
      source,

      city,
      state,
      latitude,
      longitude,
      country,
      ip,
    });

    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      return new Response("Insert failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("✅ PAGE VIEW INSERTED WITH GEO");

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("❌ ROUTE CRASH:", err);
    return new Response("Server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
