// app/api/orders/create/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const order_id = `OR-${Date.now()}`;

    /* ===============================
       1. HANDLE PHOTOS
    =============================== */
    const files = formData.getAll("photos[]") as File[];
    const photoUrls: string[] = [];

    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;

      const ext = file.name.split(".").pop();
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const path = `orders/${order_id}/${safeName}`;
      const buffer = await file.arrayBuffer();

      const { error } = await supabase.storage
        .from("order-photos")
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) continue;

      const { data } = supabase.storage
        .from("order-photos")
        .getPublicUrl(path);

      if (data?.publicUrl) photoUrls.push(data.publicUrl);
    }

    /* ===============================
       2. PARSE PRICES
    =============================== */
    const swing_price = Number(formData.get("swing_price") || 0);
    const accessory_price = Number(formData.get("accessory_price") || 0);

    /* ===============================
       3. INSERT ORDER (ONLY REAL COLUMNS)
    =============================== */
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          sheet_order_id: order_id,
          order_status: "submitted",
          final_swing_price: swing_price,
          final_accessory_price: accessory_price,
          sync_status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    /* ===============================
       4. COMMISSION CALC
    =============================== */
    const RATE = 0.12;
    const swing_commission = swing_price * RATE;
    const accessory_commission = accessory_price * RATE;
    const base_commission = swing_commission + accessory_commission;

    /* ===============================
       5. INSERT COMMISSION (MATCH DB)
    =============================== */
    const { error: commissionError } = await supabase
      .from("commissions")
      .insert([
        {
          order_id: order.id,
          swing_price,
          accessories_price: accessory_price,
          swing_commission,
          accessory_commission,
          base_commission,
          residual_amount: 0,
          payout_status: "pending",
          is_locked: false,
        },
      ]);

    if (commissionError) {
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    /* ===============================
       6. ADMIN ALERT
    =============================== */
    await supabase.from("admin_alerts").insert([
      {
        type: "new_order",
        reference_id: order_id,
        title: "New Order Submitted",
        message: "A new swing order was submitted",
        read: false,
      },
    ]);

    /* ===============================
       7. REDIRECT
    =============================== */
    return NextResponse.redirect(
      "https://doorplaceusa.com/pages/partner-order-thank-you",
      { status: 303 }
    );
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
