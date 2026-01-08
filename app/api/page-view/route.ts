export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    const body = await req.json();

    const {
      page_key,
      page_url,
      partner_id = null,
      source = "shopify",
    } = body;

    if (!page_key || !page_url) {
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ✅ Resolve IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "";

    // ✅ Load geoip-lite at REQUEST TIME (not build time)
    // @ts-ignore
    const geoip = (await import("geoip-lite")).default;
    const geo = ip ? geoip.lookup(ip) : null;

    const { error } = await supabase
      .from("page_view_events")
      .insert({
        page_key,
        page_url,
        partner_id,
        source,

        country: geo?.country || null,
        state: geo?.region || null,
        city: geo?.city || null,
        latitude: geo?.ll?.[0] || null,
        longitude: geo?.ll?.[1] || null,
      });

    if (error) {
      console.error("Insert error:", error);
      return new Response("Insert failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("API error:", err);
    return new Response("Server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
