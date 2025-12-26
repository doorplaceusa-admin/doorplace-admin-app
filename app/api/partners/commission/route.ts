// app/api/partner/commission/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function verifyShopifyPartnerAccess(email: string, partnerId: string) {
  const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
  const SHOPIFY_API_VERSION = requireEnv("SHOPIFY_API_VERSION");
  const SHOPIFY_ACCESS_TOKEN = requireEnv("SHOPIFY_ACCESS_TOKEN");

  const headers = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
  };

  const searchRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      email
    )}`,
    { headers }
  );

  const searchJson = await searchRes.json();
  if (!searchJson?.customers?.length) return false;

  const customer = searchJson.customers[0];
  const tagStr = (customer.tags || "").toString();

  const tags = tagStr
    .split(",")
    .map((t: string) => t.trim().toLowerCase())
    .filter(Boolean);

  const hasPartnerTag = tags.includes("partner") || tags.includes("swing partner");
  const hasPartnerId = tags.includes(partnerId.toLowerCase());

  return hasPartnerTag && hasPartnerId;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || "").toString().trim();
    const partner_id = (body?.partner_id || "").toString().trim();

    if (!email || !partner_id) {
      return NextResponse.json(
        { error: "email and partner_id required" },
        { status: 400 }
      );
    }

    // ✅ SECURITY: confirm this Shopify customer actually has this Partner ID tag
    const allowed = await verifyShopifyPartnerAccess(email, partner_id);
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pull ONLY this partner’s rows from leads table
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select(
        [
          "id",
          "lead_id",
          "submission_type",
          "partner_id",
          "partner_name",
          "first_name",
          "last_name",
          "lead_status",
          "order_status",
          "created_at",
          "swing_price",
          "accessory_price",
        ].join(",")
      )
      .eq("partner_id", partner_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
