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
  console.log(`[${rid}] 🔄 Refreshing token`);

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

  if (!res.ok) {
    console.log(`[${rid}] ❌ Refresh failed`, json);
    throw new Error("Refresh failed");
  }

  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

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

/* 🔥 fetch single client (for missing ones) */
async function fetchSingleClient(id: string, token: string) {
  const ACCOUNT_ID = process.env.FRESHBOOKS_ACCOUNT_ID;

  const res = await fetch(
    `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/users/clients/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await res.json();
  return json?.response?.result?.client || {};
}

export async function GET() {
  const rid = `fb_${Date.now()}`;

  try {
    console.log(`🔥 [${rid}] INVOICE API HIT`);

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
      `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices?per_page=100`;

    async function fetchInvoices(token: string) {
      return fetch(invoiceUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    }

    let fbRes = await fetchInvoices(accessToken);

    if (fbRes.status === 401) {
      console.log(`[${rid}] 🔁 Token expired`);
      accessToken = await refreshFreshBooksToken(rid);
      fbRes = await fetchInvoices(accessToken);
    }

    let allInvoices: any[] = [];
let page = 1;
let totalPages = 1;

while (page <= totalPages) {
  console.log(`[${rid}] 📄 invoice page ${page}/${totalPages}`);

  const res = await fetch(
    `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices?page=${page}&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  const invoicesPage = data?.response?.result?.invoices || [];
  const meta = data?.response?.meta;

  allInvoices.push(...invoicesPage);

  totalPages = meta?.pages || 1;

  page++;
}

console.log(`[${rid}] 📦 TOTAL invoices fetched:`, allInvoices.length);


    // ============================
    // 🔥 FETCH ALL CLIENTS (PAGINATED)
    // ============================
    let allClients: any[] = [];
let clientPage = 1;
let clientTotalPages = 1;
    while (clientPage <= clientTotalPages) {
      const res = await fetch(
        `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/users/clients?page=${clientPage}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await res.json();

      const clients = data?.response?.result?.clients || [];
      const meta = data?.response?.meta;

      allClients.push(...clients);

      clientTotalPages = meta?.pages || 1;
      console.log(`[${rid}] 📄 client page ${clientPage}/${clientTotalPages}`);

      clientPage++;
    }

    console.log(`[${rid}] 👥 TOTAL CLIENTS:`, allClients.length);

    const clientMap = new Map(
      allClients.map((c: any) => [String(c.id), c])
    );

    // ============================
    // 🔥 BUILD INVOICES
    // ============================
    const invoices = [];

    for (const inv of allInvoices) {
      let client: any = clientMap.get(String(inv.customerid));

      // 🔥 fallback fetch for missing clients
      if (!client && inv.customerid) {
        console.log(`[${rid}] 🔍 fetching missing client ${inv.customerid}`);
        client = await fetchSingleClient(String(inv.customerid), accessToken);
      }

      const contactPhone =
        client?.phone ||
        client?.mobile ||
        client?.bus_phone ||
        client?.work_phone ||
        client?.home_phone ||
        client?.phone_number ||
        (client?.contacts || []).find((c: any) => c?.value)?.value ||
        "";

      const contactEmail =
        client?.email ||
        client?.email_address ||
        (client?.contacts || []).find((c: any) =>
          (c?.type || "").toLowerCase().includes("email")
        )?.value ||
        (client?.contacts || []).find((c: any) =>
          (c?.value || "").includes("@")
        )?.value ||
        inv.email || // fallback
        "";

      invoices.push({
        invoiceid: inv.id,
        invoice_number: inv.invoice_number,
        status: inv.status,
        issued_at: inv.create_date,
        due_date: inv.due_date,

        customer_name:
          [inv.fname, inv.lname].filter(Boolean).join(" ") ||
          inv.organization ||
          "",

        customer_email: contactEmail,
        customer_phone: normalizePhone(contactPhone),

        street: inv.street || "",
        city: inv.city || "",
        province: inv.province || "",
        postal_code: inv.code || "",

        // 🔥 LINE ITEMS
        line_items: (inv.lines || []).map((line: any) => ({
          name: line.name || "",
          description: line.description || "",
          qty: line.qty || 0,
          unit_price: line.unit_cost?.amount || "0",
          total: line.amount?.amount || "0",
        })),

        amount: inv.amount?.amount || "0",
        paid_amount: inv.paid?.amount || "0",
        outstanding_amount: inv.outstanding?.amount || "0",
      });
    }

    console.log(`[${rid}] 💾 inserting into Supabase...`);

    const { error } = await supabaseAdmin
      .from("invoices")
      .upsert(invoices, { onConflict: "invoiceid" });

    if (error) {
      console.log(`[${rid}] ❌ Supabase error:`, error);
    } else {
      console.log(`[${rid}] ✅ Supabase insert success`);
    }

    return NextResponse.json({ invoices, count: invoices.length, rid });

  } catch (e: any) {
    console.log(`❌ API ERROR:`, e);
    return NextResponse.json(
      { error: e.message || "API error" },
      { status: 500 }
    );
  }
}