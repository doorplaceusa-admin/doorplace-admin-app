import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ===============================
   🔄 REFRESH TOKEN (SAME AS MAIN ROUTE)
================================ */
async function refreshFreshBooksToken() {
  const { data: tokenRow } = await supabase
    .from("freshbooks_tokens")
    .select("refresh_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!tokenRow?.refresh_token) {
    throw new Error("No refresh token found");
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
    console.error("❌ Token refresh failed:", json);
    throw new Error("Token refresh failed");
  }

  const expiresAt = new Date(
    Date.now() + json.expires_in * 1000
  ).toISOString();

  await supabase.from("freshbooks_tokens").delete().neq("id", "");
  await supabase.from("freshbooks_tokens").insert({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    token_type: json.token_type || "Bearer",
    expires_at: expiresAt,
  });

  return json.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invoiceId = String(body.invoiceId);

    console.log("🚀 SYNC START:", invoiceId);

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    /* ===============================
       🔐 GET VALID ACCESS TOKEN
    =============================== */
    const { data: tokenRow } = await supabase
      .from("freshbooks_tokens")
      .select("access_token")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!tokenRow?.access_token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    let accessToken = tokenRow.access_token;

    const ACCOUNT_ID = process.env.FRESHBOOKS_ACCOUNT_ID!;

    /* ===============================
       🔥 FETCH FROM FRESHBOOKS
    =============================== */
    async function fetchInvoice(token: string) {
      return fetch(
        `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices/${invoiceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let response = await fetchInvoice(accessToken);

    // 🔁 Handle expired token
    if (response.status === 401) {
      console.log("🔁 Token expired, refreshing...");
      accessToken = await refreshFreshBooksToken();
      response = await fetchInvoice(accessToken);
    }

    const json = await response.json();

    if (!response.ok) {
      console.error("❌ FreshBooks API error:", json);
      return NextResponse.json(
        { error: "FreshBooks fetch failed", details: json },
        { status: 500 }
      );
    }

    const invoice = json?.response?.result?.invoice;

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    console.log("✅ Invoice pulled:", invoice.invoiceid);

    /* ===============================
       🔥 CONTACT EXTRACTION
    =============================== */
    const contact = invoice?.contacts?.[0] || {};

    const email = contact?.email || "";
    const phone = (contact?.phone || "").replace(/\D/g, "").slice(-10);

    /* ===============================
       🔥 UPSERT INVOICE
    =============================== */
    const invoicePayload = {
      invoice_id: String(invoice.invoiceid),
      customer_name:
        invoice?.organization ||
        [invoice?.fname, invoice?.lname].filter(Boolean).join(" ") ||
        "",
      email,
      phone,
      amount: invoice?.amount?.amount || 0,
      status: invoice?.status || "",
      updated_at: new Date().toISOString(),
    };

    const { error: invoiceError } = await supabase
      .from("invoices")
      .upsert(invoicePayload, { onConflict: "invoice_id" });

    if (invoiceError) {
      console.error("❌ Invoice upsert error:", invoiceError);
    } else {
      console.log("✅ Invoice upserted");
    }

    /* ===============================
       🔥 LINE ITEMS BUILD
    =============================== */
    const lineItems =
      invoice?.lines?.map((line: any) => ({
        invoice_id: String(invoice.invoiceid),
        name: line?.name || "",
        description: line?.description || "",
        quantity: line?.qty || 0,
        unit_cost: line?.unit_cost?.amount || 0,
        total: line?.amount?.amount || 0,
      })) || [];

    console.log("📦 Line items:", lineItems.length);

    /* ===============================
       🔥 DELETE + INSERT
    =============================== */
    if (lineItems.length > 0) {
      await supabase
        .from("invoice_line_items")
        .delete()
        .eq("invoice_id", String(invoice.invoiceid));

      const { error: insertError } = await supabase
        .from("invoice_line_items")
        .insert(lineItems);

      if (insertError) {
        console.error("❌ Insert error:", insertError);
      } else {
        console.log("✅ Line items inserted");
      }
    }

    console.log("🎯 SYNC COMPLETE");

    return NextResponse.json({
      success: true,
      invoiceId,
      lineItemsCount: lineItems.length,
      email,
      phone,
    });

  } catch (err: any) {
    console.error("🔥 SYNC ERROR:", err);

    return NextResponse.json(
      {
        error: "Server error",
        message: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}