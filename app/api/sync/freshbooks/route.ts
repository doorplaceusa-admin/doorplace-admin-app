import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    // 🔥 Pull invoice from FreshBooks
    const fbRes = await fetch(
      `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices/${invoiceId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FRESHBOOKS_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const fbData = await fbRes.json();

    const lines = fbData?.response?.result?.invoice?.lines || [];

    if (!lines.length) {
      return NextResponse.json({ message: "No line items found" });
    }

    // 🔁 Clean + format
    const items = lines.map((l: any) => ({
      invoice_id: invoiceId,
      name: l.name,
      description: l.description,
      quantity: l.qty,
      unit_price: Number(l.unit_cost?.amount || 0),
      total: Number(l.amount?.amount || 0),
    }));

    // 🧹 Replace existing items
    await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", invoiceId);

    // ➕ Insert new
    const { error } = await supabase
      .from("invoice_line_items")
      .insert(items);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: items.length,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}