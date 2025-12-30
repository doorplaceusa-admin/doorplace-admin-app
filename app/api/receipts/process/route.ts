import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpenAI from "openai";

export const runtime = "nodejs";

/* ===============================
   OpenAI Client
================================ */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    console.log("🧠 RECEIPT OCR PROCESS STARTED");

    /* ===============================
       1️⃣ Read body
    ================================ */
    const body = await req.json();
    const receipt_id = body?.receipt_id;

    if (!receipt_id) {
      return NextResponse.json(
        { error: "receipt_id required" },
        { status: 400 }
      );
    }

    /* ===============================
       2️⃣ Fetch receipt
    ================================ */
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from("receipts")
      .select("id, image_url")
      .eq("id", receipt_id)
      .single();

    if (fetchError || !receipt?.image_url) {
      throw fetchError || new Error("Receipt not found");
    }

    /* ===============================
       3️⃣ OpenAI Vision OCR
    ================================ */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract receipt data. Respond ONLY in JSON with keys: vendor, total, items (array of { name, qty, total_price }).",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract receipt data from this image." },
            {
              type: "image_url",
              image_url: receipt.image_url, // MUST be string
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    const vendor = parsed.vendor ?? null;
    const total_amount = Number(parsed.total ?? 0);
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    /* ===============================
       4️⃣ Insert receipt items
    ================================ */
    if (items.length > 0) {
      const itemRows = items.map((item: any) => ({
        receipt_id,
        item_name: String(item.name || ""),
        quantity: Number(item.qty || 1),
        total_price: Number(item.total_price || 0),
        unit_price:
          item.qty && item.total_price
            ? Number(item.total_price) / Number(item.qty)
            : null,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("receipt_items")
        .insert(itemRows);

      if (itemsError) throw itemsError;
    }

    /* ===============================
       5️⃣ Update receipt summary
    ================================ */
    const { error: updateError } = await supabaseAdmin
      .from("receipts")
      .update({
        vendor,
        total: total_amount,
        processed_at: new Date().toISOString(),
      })
      .eq("id", receipt_id);

    if (updateError) throw updateError;

    console.log("✅ RECEIPT OCR PROCESS COMPLETE");

    return NextResponse.json({
      status: "processed",
      receipt_id,
      vendor,
      total: total_amount,
      items_count: items.length,
    });
  } catch (err) {
    console.error("❌ RECEIPT PROCESS ERROR:", err);
    return NextResponse.json(
      { error: "Receipt processing failed" },
      { status: 500 }
    );
  }
}
