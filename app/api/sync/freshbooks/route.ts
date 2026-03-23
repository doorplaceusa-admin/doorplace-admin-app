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
      console.log("❌ Missing invoiceId");
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    // ===============================
    // 🔥 FETCH FROM FRESHBOOKS
    // ===============================
    console.log("📡 Fetching from FreshBooks...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 sec timeout

    const response = await fetch(
      `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices/${invoiceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FRESHBOOKS_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

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
      console.log("❌ No invoice found");
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    console.log("✅ Invoice pulled:", invoice.invoiceid);

    // ===============================
    // 🔥 SAFE CONTACT EXTRACTION
    // ===============================
    const contact = invoice?.contacts?.[0] || {};

    const email = contact?.email || "";
    const phone = contact?.phone || "";

    console.log("📞 Contact:", { email, phone });

    // ===============================
    // 🔥 UPSERT INVOICE
    // ===============================
    const invoicePayload = {
      invoice_id: String(invoice.invoiceid),
      customer_name: invoice?.organization || "",
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

    // ===============================
    // 🔥 LINE ITEMS BUILD
    // ===============================
    const lineItems =
      invoice?.lines?.map((line: any) => ({
        invoice_id: String(invoice.invoiceid),
        name: line?.name || "",
        description: line?.description || "",
        quantity: line?.qty || 0,
        unit_cost: line?.unit_cost?.amount || 0,
        total: line?.amount?.amount || 0,
      })) || [];

    console.log("📦 Line items found:", lineItems.length);

    // ===============================
    // 🔥 SAFE DELETE + INSERT
    // ===============================
    if (lineItems.length > 0) {
      const { error: deleteError } = await supabase
        .from("invoice_line_items")
        .delete()
        .eq("invoice_id", String(invoice.invoiceid));

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
      } else {
        console.log("🧹 Old line items cleared");
      }

      const { error: insertError } = await supabase
        .from("invoice_line_items")
        .insert(lineItems);

      if (insertError) {
        console.error("❌ Insert error:", insertError);
      } else {
        console.log("✅ Line items inserted:", lineItems.length);
      }
    } else {
      console.log("⚠️ No line items to insert");
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