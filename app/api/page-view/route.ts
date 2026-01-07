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

    const { error } = await supabase
      .from("page_view_events")
      .insert({
        page_key,
        page_url,
        partner_id,
        source,
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
