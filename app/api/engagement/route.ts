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

    // 1) Get IP
    const rawIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      "";
    const ip = rawIp.split(",")[0].trim();

    // 2) Get body
    const body = await req.json();
    const { page_key } = body;

    if (!page_key || !ip) {
      return new Response("Missing data", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3) Time window (last 15 seconds)
    const fifteenSecondsAgo = new Date(Date.now() - 15000).toISOString();

    // 4) Update latest matching view → verified human
    const { error } = await supabase
      .from("page_view_events")
      .update({ source: "verified_human" })
      .eq("ip_address", ip)
      .eq("page_key", page_key)
      .gte("created_at", fifteenSecondsAgo);

    if (error) {
      console.error("❌ Engagement update error:", error);
      return new Response("DB Error", {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log(`✅ VERIFIED HUMAN: ${page_key} | IP: ${ip}`);

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