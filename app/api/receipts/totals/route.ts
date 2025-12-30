import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * Returns:
 * - total receipts count
 * - total spend
 * - totals grouped by item
 * - totals grouped by month
 */
export async function GET() {
  try {
    /* ===============================
       TOTAL RECEIPTS + TOTAL SPEND
    =============================== */
    const { data: totals, error: totalsError } = await supabaseAdmin
      .from("receipt_items")
      .select("quantity, total_price");

    if (totalsError) throw totalsError;

    let totalSpend = 0;
    let totalItems = 0;

    for (const row of totals ?? []) {
      totalSpend += Number(row.total_price || 0);
      totalItems += Number(row.quantity || 0);
    }

    /* ===============================
       TOTALS BY ITEM
    =============================== */
    const { data: byItem, error: itemError } = await supabaseAdmin
      .from("receipt_items")
      .select("item_name, quantity, total_price");

    if (itemError) throw itemError;

    const itemTotals: Record<
      string,
      { quantity: number; total: number }
    > = {};

    for (const row of byItem ?? []) {
      if (!itemTotals[row.item_name]) {
        itemTotals[row.item_name] = { quantity: 0, total: 0 };
      }

      itemTotals[row.item_name].quantity += Number(row.quantity || 0);
      itemTotals[row.item_name].total += Number(row.total_price || 0);
    }

    /* ===============================
       TOTALS BY MONTH
    =============================== */
    const { data: byMonth, error: monthError } = await supabaseAdmin
      .from("receipts")
      .select("created_at");

    if (monthError) throw monthError;

    const monthTotals: Record<string, number> = {};

    for (const r of byMonth ?? []) {
      const month = new Date(r.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthTotals[month] = (monthTotals[month] || 0) + 1;
    }

    return NextResponse.json({
      totals: {
        total_spend: totalSpend,
        total_items: totalItems,
      },
      by_item: itemTotals,
      by_month: monthTotals,
    });
  } catch (err) {
    console.error("RECEIPTS TOTALS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to calculate receipt totals" },
      { status: 500 }
    );
  }
}
