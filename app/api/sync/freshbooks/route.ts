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

    // 🔥 FETCH FROM FRESHBOOKS
    const url = `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices/${invoiceId}`;

    console.log("📡 Fetching FreshBooks:", url);

    const fbRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FRESHBOOKS_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 FreshBooks status:", fbRes.status);

    if (!fbRes.ok) {
      const text = await fbRes.text();
      console.log("❌ FreshBooks ERROR:", text);
      throw new Error(`FreshBooks error: ${text}`);
    }

    const fbData = await fbRes.json();

    console.log("📦 FULL FreshBooks Response:", JSON.stringify(fbData, null, 2));

    const invoice = fbData?.response?.result?.invoice;

    if (!invoice) {
      console.log("❌ Invoice missing in response");
      throw new Error("Invoice not found in FreshBooks response");
    }

    const lines = invoice.lines || [];

    console.log("📦 LINE ITEMS FOUND:", lines.length);

    // 🔥 DELETE OLD
    const { error: deleteError } = await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", invoiceId);

    if (deleteError) {
      console.log("❌ DELETE ERROR:", deleteError);
      throw deleteError;
    }

    console.log("🧹 Old line items cleared");

    if (!lines.length) {
      console.log("⚠️ No line items on this invoice");

      return NextResponse.json({
        success: true,
        count: 0,
        message: "No line items on invoice",
      });
    }

    // 🔁 FORMAT
    const items = lines.map((l: any, idx: number) => {
      const item = {
        invoice_id: invoiceId,
        name: l.name || "",
        description: l.description || "",
        quantity: Number(l.qty || 0),
        unit_price: Number(l.unit_cost?.amount || 0),
        total: Number(l.amount?.amount || 0),
      };

      console.log(`📦 Item ${idx}:`, item);
      return item;
    });

    // 🔥 INSERT
    const { error: insertError } = await supabase
      .from("invoice_line_items")
      .insert(items);

    if (insertError) {
      console.log("❌ INSERT ERROR:", insertError);
      throw insertError;
    }

    console.log("✅ INSERT SUCCESS:", items.length);

    return NextResponse.json({
      success: true,
      count: items.length,
    });

  } catch (err: any) {
    console.error("🔥 FINAL ERROR:", err);

    return NextResponse.json(
      {
        error: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}