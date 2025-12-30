import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";

/* ============================
   GET — LIST RECEIPTS (Dashboard)
============================ */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("receipts")
      .select("id, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("RECEIPT LIST ERROR:", err);
    return NextResponse.json([], { status: 200 });
  }
}

/* ============================
   POST — UPLOAD RECEIPT
============================ */
export async function POST(req: Request) {
  try {
    console.log("🔥 RECEIPT UPLOAD API HIT");

    const formData = await req.formData();
    const file = formData.get("receipt") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    /* ============================
       1️⃣ Upload to Storage
    ============================ */
    const fileExt = file.name.split(".").pop();
    const filePath = `receipts/${Date.now()}.${fileExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);

    /* ============================
       2️⃣ OCR PLACEHOLDER
    ============================ */
    const raw_text = "";

    /* ============================
       3️⃣ Save Receipt Record
       (❌ removed `status` column)
    ============================ */
    const { data: receipt, error: insertError } = await supabaseAdmin
      .from("receipts")
      .insert({
        image_url: publicUrl.publicUrl,
        raw_text,
      })
      .select("id")
      .single();

    if (insertError || !receipt) throw insertError;

    /* ============================
       4️⃣ Trigger OCR Processor (async)
    ============================ */
    fetch(new URL("/api/receipts/process", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt_id: receipt.id }),
    }).catch((err) => {
      console.error("OCR PROCESS TRIGGER FAILED:", err);
    });

    return NextResponse.json({
      status: "receipt_uploaded",
      receipt_id: receipt.id,
    });
  } catch (err) {
    console.error("RECEIPT UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
