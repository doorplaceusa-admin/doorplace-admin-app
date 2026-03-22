import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invoiceId = String(body.invoiceId);

    console.log("🚀 SYNC START:", invoiceId);

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    // 🔥 FETCH FROM FRESHBOOKS (same logic style as working route)
    const response = await fetch(
      `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices/${invoiceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FRESHBOOKS_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("❌ FreshBooks API error:", json);
      return NextResponse.json({ error: "FreshBooks fetch failed" }, { status: 500 });
    }

    const invoice = json?.response?.result?.invoice;

    if (!invoice) {
      console.log("❌ No invoice found");
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    console.log("✅ FreshBooks invoice pulled:", invoice.invoiceid);

    // ===============================
    // 🔥 UPSERT INVOICE
    // ===============================
    const invoicePayload = {
      invoice_id: String(invoice.invoiceid),
      customer_name: invoice?.organization || "",
      email: invoice?.contacts?.[0]?.email || "",
      phone: invoice?.contacts?.[0]?.phone || "",
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

    // ===============================
    // 🔥 DELETE OLD LINE ITEMS
    // ===============================
    await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", invoice.invoiceid);

    console.log("🧹 Old line items cleared");

    // ===============================
    // 🔥 INSERT LINE ITEMS
    // ===============================
    const lineItems =
      invoice?.lines?.map((line: any) => ({
        invoice_id: String(invoice.invoiceid),
        name: line?.name || "",
        description: line?.description || "",
        qty: line?.qty || 0,
        unit_cost: line?.unit_cost?.amount || 0,
        total: line?.amount?.amount || 0,
      })) || [];

    if (lineItems.length > 0) {
      const { error: lineError } = await supabase
        .from("invoice_line_items")
        .insert(lineItems);

      if (lineError) {
        console.error("❌ Line item insert error:", lineError);
      } else {
        console.log("✅ Line items inserted:", lineItems.length);
      }
    }

    console.log("🎯 SYNC COMPLETE");

    return NextResponse.json({
      success: true,
      invoiceId,
      lineItemsCount: lineItems.length,
    });
  } catch (err) {
    console.error("🔥 SYNC ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}