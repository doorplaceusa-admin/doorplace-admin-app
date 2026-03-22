import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    // 🔑 FreshBooks API call
    const response = await fetch(
      `https://api.freshbooks.com/accounting/account/YOUR_ACCOUNT_ID/invoices/invoices/${invoiceId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FRESHBOOKS_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    const lines = data?.response?.result?.invoice?.lines || [];

    if (!lines.length) {
      return NextResponse.json({ message: "No line items found" });
    }

    // 🧱 Format for Supabase
    const formatted = lines.map((item: any) => ({
      invoice_id: invoiceId,
      name: item.name,
      description: item.description,
      quantity: item.qty,
      unit_price: item.unit_cost?.amount || 0,
      total: item.amount?.amount || 0,
    }));

    // 🧹 Delete old ones first (avoid duplicates)
    await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", invoiceId);

    // ➕ Insert new ones
    const { error } = await supabase
      .from("invoice_line_items")
      .insert(formatted);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      inserted: formatted.length,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}