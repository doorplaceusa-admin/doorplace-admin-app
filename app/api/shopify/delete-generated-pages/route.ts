export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteShopifyPage } from "@/lib/shopify/deleteShopifyPage";

export async function POST() {
  try {
    console.log("🧹 DELETE GENERATED PAGES API HIT");

    // Start of today (server time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pull ALL pages from today first
    const { data: pages, error } = await supabaseAdmin
      .from("generated_pages")
      .select("id, title, shopify_page_id, created_at")
      .gte("created_at", today.toISOString());

    if (error) throw error;

    // Filter in JS (safer than ilike)
    const cribPages = (pages || []).filter(
      (p) =>
        p.shopify_page_id &&
        typeof p.title === "string" &&
        p.title.toLowerCase().includes("crib")
    );

    console.log(`Found ${cribPages.length} crib pages from today`);

    let deleted = 0;

    for (const page of cribPages) {
      try {
        await deleteShopifyPage(page.shopify_page_id);

        await supabaseAdmin
          .from("generated_pages")
          .update({
            shopify_page_id: null,
            status: "deleted",
          })
          .eq("id", page.id);

        deleted++;
      } catch (err) {
        console.error("❌ Failed deleting:", page.title, err);
      }
    }

    return NextResponse.json({
      success: true,
      found: cribPages.length,
      deleted,
      scope: "TODAY + crib only",
    });
  } catch (err: any) {
    console.error("delete-generated-pages error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
