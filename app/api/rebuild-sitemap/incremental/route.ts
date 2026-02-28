import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 5000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET() {
  const startTime = Date.now();
  let totalInserted = 0;
  let batchNumber = 0;

  try {
    console.log("🚀 SAFE INCREMENTAL STARTED");

    // 1️⃣ Get append index
    const { data: lastPosRows, error: lastPosError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number, position")
      .order("chunk_number", { ascending: false })
      .order("position", { ascending: false })
      .limit(1);

    if (lastPosError) {
      console.error("Failed reading last position:", lastPosError);
      return new NextResponse("Failed reading last position", { status: 500 });
    }

    let globalIndex = 0;

    if (lastPosRows?.length) {
      const last = lastPosRows[0];
      globalIndex = last.chunk_number * CHUNK_SIZE + last.position + 1;
    }

    while (true) {
      batchNumber++;

      // 🔥 Pull missing rows ONLY
      const { data: invBatch, error: invError } = await supabaseAdmin
        .rpc("tp_get_missing_inventory_batch", {
          batch_size: BATCH_SIZE
        });

      if (invError) {
        console.error("Missing batch error:", invError);
        return new NextResponse("Missing batch error", { status: 500 });
      }

      if (!invBatch || invBatch.length === 0) {
        break;
      }

      const rowsToInsert = invBatch.map((row: any, i: number) => {
        const rowNumber = globalIndex + i;
        return {
          chunk_number: Math.floor(rowNumber / CHUNK_SIZE),
          position: rowNumber % CHUNK_SIZE,
          url: row.url,
          last_modified: row.last_modified,
        };
      });

      const { error: upsertError } = await supabaseAdmin
        .from("sitemap_chunks")
        .upsert(rowsToInsert, {
          onConflict: "url",
          ignoreDuplicates: true,
        });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        return new NextResponse("Upsert error", { status: 500 });
      }

      totalInserted += rowsToInsert.length;
      globalIndex += rowsToInsert.length;

      console.log(`Batch ${batchNumber} inserted ${rowsToInsert.length}`);

      await sleep(50);
    }

    console.log("🎉 SAFE INCREMENTAL COMPLETE");
    console.log("Total Inserted:", totalInserted);

    return new NextResponse(
      `Incremental complete. Inserted ${totalInserted} URLs.`
    );
  } catch (err: any) {
    console.error("Server error:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}