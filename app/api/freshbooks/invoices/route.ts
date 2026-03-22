// app/api/freshbooks/invoices/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* 🔹 normalize phone */
function normalizePhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
}

/* 🔹 refresh token */
async function refreshFreshBooksToken(rid: string) {
  const { data: tokenRow } = await supabaseAdmin
    .from("freshbooks_tokens")
    .select("refresh_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!tokenRow?.refresh_token) throw new Error("No refresh token");

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
  if (!res.ok) throw new Error("Refresh failed");

  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

  await supabaseAdmin.from("freshbooks_tokens").delete().neq("id", "");
  await supabaseAdmin.from("freshbooks_tokens").insert({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    token_type: json.token_type || "Bearer",
    expires_at: expiresAt,
  });

  return json.access_token;
}

export async function GET() {
  const rid = `fb_${Date.now()}`;

  try {
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

    const ACCOUNT_ID = process.env.FRESHBOOKS_ACCOUNT_ID!;
    const invoiceUrl =
      `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices?per_page=500`;

    async function fetchInvoices(token: string) {
      return fetch(invoiceUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    let fbRes = await fetchInvoices(accessToken);

    if (fbRes.status === 401) {
      accessToken = await refreshFreshBooksToken(rid);
      fbRes = await fetchInvoices(accessToken);
    }

    const json = await fbRes.json();
    const invoicesArr = json?.response?.result?.invoices || [];

    // 🔥 FETCH CLIENTS (for phone)
    const clientsRes = await fetch(
      `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/users/clients`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const clientsJson = await clientsRes.json();
    const clientsArr = clientsJson?.response?.result?.clients || [];

    const clientMap = new Map(
      clientsArr.map((c: any) => [String(c.id), c])
    );

    const invoices = invoicesArr.map((inv: any) => {
      const client: any = clientMap.get(String(inv.customerid)) || {};

      // 🔥 FINAL PHONE FIX (covers ALL FreshBooks cases)
      const contactPhone =
        client?.phone ||
        client?.mobile ||
        client?.bus_phone ||
        client?.work_phone ||
        client?.home_phone ||
        client?.phone_number ||
        (client?.contacts || []).find((c: any) => c?.value)?.value ||
        "";

      return {
        invoiceid: inv.id,
        invoice_number: inv.invoice_number,
        status: inv.status,
        issued_at: inv.create_date,
        due_date: inv.due_date,

        // ✅ name from invoice
        customer_name:
          [inv.fname, inv.lname].filter(Boolean).join(" ") ||
          inv.organization ||
          "",

        customer_email: inv.email || "",

        // 🔥 phone from client (fixed)
        customer_phone: normalizePhone(contactPhone),

        // ✅ address from invoice
        street: inv.street || "",
        city: inv.city || "",
        province: inv.province || "",
        postal_code: inv.code || "",

        amount: inv.amount?.amount || "0",
        paid_amount: inv.paid?.amount || "0",
        outstanding_amount: inv.outstanding?.amount || "0",
      };
    });

    await supabaseAdmin
      .from("invoices")
      .upsert(invoices, { onConflict: "invoiceid" });

    return NextResponse.json({ invoices, count: invoices.length, rid });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "API error", rid },
      { status: 500 }
    );
  }
}