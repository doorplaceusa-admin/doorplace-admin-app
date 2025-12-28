// app/api/freshbooks/invoices/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mask(v?: string | null) {
  if (!v) return "";
  if (v.length <= 8) return "****";
  return `${v.slice(0, 4)}****${v.slice(-4)}`;
}

/* 🟢 NEW — helper to refresh token */
async function refreshFreshBooksToken(rid: string) {
  console.log(`[${rid}] 🔄 Attempting token refresh`);

  const { data: tokenRow } = await supabaseAdmin
    .from("freshbooks_tokens")
    .select("refresh_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!tokenRow?.refresh_token) {
    throw new Error("No refresh_token available");
  }

  const res = await fetch("https://api.freshbooks.com/auth/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: tokenRow.refresh_token,
      client_id: process.env.FRESHBOOKS_CLIENT_ID,
      client_secret: process.env.FRESHBOOKS_CLIENT_SECRET,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.log(`[${rid}] ❌ Refresh failed`, json);
    throw new Error("Token refresh failed");
  }

  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

  // single source of truth
  await supabaseAdmin.from("freshbooks_tokens").delete().neq("id", "");

  await supabaseAdmin.from("freshbooks_tokens").insert({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    token_type: json.token_type || "Bearer",
    expires_at: expiresAt,
  });

  console.log(`[${rid}] ✅ Token refreshed`);
  return json.access_token;
}

export async function GET(req: Request) {
  const rid = `fb_inv_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    console.log(`\n========== [${rid}] FreshBooks invoices GET ==========`);

    const tokenQuery = await supabaseAdmin
      .from("freshbooks_tokens")
      .select("access_token")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!tokenQuery.data?.access_token) {
      return NextResponse.json({ error: "No token", rid }, { status: 401 });
    }

    let accessToken = tokenQuery.data.access_token;

    const ACCOUNT_ID = process.env.FRESHBOOKS_ACCOUNT_ID;
    if (!ACCOUNT_ID) {
      return NextResponse.json({ error: "No account id", rid }, { status: 500 });
    }

    const url =
      `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices` +
      `?include[]=lines&include[]=client&include[]=payments&per_page=500`;

    /* 🟢 NEW — wrapped request so we can retry after refresh */
    async function fetchInvoices(token: string) {
      return fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    }

    let fbRes = await fetchInvoices(accessToken);

    /* 🟢 NEW — auto refresh on 401 */
    if (fbRes.status === 401) {
      console.log(`[${rid}] 🔁 Access token expired`);
      accessToken = await refreshFreshBooksToken(rid);
      fbRes = await fetchInvoices(accessToken);
    }

    const raw = await fbRes.text();

    if (!fbRes.ok) {
      return NextResponse.json(
        {
          error: "FreshBooks request failed",
          status: fbRes.status,
          bodyPreview: raw.slice(0, 1200),
          rid,
        },
        { status: 502 }
      );
    }

    const json = JSON.parse(raw);
    const invoicesArr = json?.response?.result?.invoices;

    if (!Array.isArray(invoicesArr)) {
      return NextResponse.json(
        { error: "Unexpected response shape", rid },
        { status: 502 }
      );
    }

    const invoices = invoicesArr.map((inv: any) => {
      const client = inv.client || {};

      return {
        invoiceid: inv.id,
        invoice_number: inv.invoice_number,
        status: inv.status,
        issued_at: inv.create_date,
        due_date: inv.due_date,
        customer_name:
          [client.fname, client.lname].filter(Boolean).join(" ") ||
          client.organization ||
          "",
        customer_email: client.email || "",
        customer_phone: client?.phone || "",
        street: client.p_street || "",
        city: client.p_city || "",
        province: client.p_province || "",
        postal_code: client.p_postal_code || "",
        currency_code: inv.amount?.currency || "USD",
        amount: inv.amount?.amount || "0",
        paid_amount: inv.paid?.amount || "0",
        outstanding_amount: inv.outstanding?.amount || "0",
        notes: inv.notes || "",
        lines: (inv.lines || []).map((l: any) => ({
          name: l.name,
          description: l.description,
          qty: Number(l.qty || 1),
          unit_cost: { amount: l.unit_cost?.amount || "0" },
          amount: { amount: l.amount?.amount || "0" },
        })),
        pdf_url: inv.links?.client_view || "",
      };
    });

    return NextResponse.json({ invoices, rid });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "API error", rid },
      { status: 500 }
    );
  }
}
