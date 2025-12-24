// app/api/orders/process/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return NextResponse.json({ error: "Missing lead_id" }, { status: 400 });
    }

    /* ===============================
       1️⃣ FETCH LEAD (BY lead_id STRING)
    =============================== */
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("lead_id", lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    /* ===============================
       2️⃣ ONLY PARTNER ORDERS
    =============================== */
    if (lead.submission_type !== "partner_order") {
      return NextResponse.json({ skipped: true });
    }

    /* ===============================
       3️⃣ PREVENT DUPLICATES
    =============================== */
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("lead_id", lead.lead_id)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        order_id: existingOrder.id,
        already_exists: true,
      });
    }

    /* ===============================
       4️⃣ CREATE ORDER
    =============================== */
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        lead_id: lead.lead_id,

        submission_type: "partner_order",
        is_partner_order: true,

        // Partner
        partner_id: lead.partner_id,

        // Customer
        customer_first_name: lead.first_name,
        customer_last_name: lead.last_name,
        customer_email: lead.email,
        customer_phone: lead.phone,
        customer_street_address: lead.street_address,
        customer_city: lead.city,
        customer_state: lead.state,
        customer_zip: lead.zip,

        // Swing
        swing_size: lead.swing_size,
        wood_type: lead.wood_type,
        finish: lead.finish,
        hanging_method: lead.hanging_method,

        // Pricing
        swing_price: lead.swing_price ?? 0,
        accessory_price: lead.accessory_price ?? 0,
        installation_fee: lead.installation_fee ?? 0,
        shipping_fee: lead.shipping_fee ?? 0,

        // Media
        photos: lead.photos ?? [],

        // Status
        order_status: "new",
        submitted_at: lead.created_at,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    /* ===============================
       5️⃣ CREATE COMMISSION SHELL
    =============================== */
    await supabaseAdmin.from("commissions").insert({
      order_id: order.id,
      partner_id: order.partner_id,
      commission_amount: 0,
      residual_amount: 0,
      bonus_amount: 0,
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
