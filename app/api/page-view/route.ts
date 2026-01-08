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
    console.log("📦 BODY RECEIVED:", body);

    const {
      page_key,
      page_url,
      partner_id = null,
      source = "unknown",
    } = body;

    if (!page_key || !page_url) {
      console.error("❌ INVALID PAYLOAD");
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { error } = await supabase
      .from("page_view_events")
      .insert({
        page_key,
        page_url,
        partner_id,
        source,
      });

    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      return new Response("Insert failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("✅ PAGE VIEW INSERTED");

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
