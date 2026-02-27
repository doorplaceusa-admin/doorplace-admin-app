import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 5000;
// PostgREST has practical limits; 1000 keeps .in() safe
const EXISTS_CHECK_BATCH = 1000;

export async function GET() {
  const startTime = Date.now();

  let totalInserted = 0;
  let totalInventoryScanned = 0;
  let totalNewDetected = 0;
  let batchNumber = 0;

  try {
    console.log("====================================================");
    console.log("🚀 INCREMENTAL SITEMAP REBUILD (SAFE) STARTED");
    console.log("🕒 Start Time:", new Date().toISOString());
    console.log("====================================================");

    // 1) Get current last chunk+position to compute append index
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number, position")
      .order("chunk_number", { ascending: false })
      .order("position", { ascending: false })
      .limit(1);

    if (existingError) {
      console.error("❌ Failed reading existing sitemap rows:", existingError);
      return new NextResponse("Failed reading existing sitemap", { status: 500 });
    }

    let globalIndex = 0;
    let startingChunkNumber = 0;

    if (existingRows && existingRows.length > 0) {
      const last = existingRows[0];
      startingChunkNumber = last.chunk_number;
      globalIndex = last.chunk_number * CHUNK_SIZE + last.position + 1;
    }

    console.log("📍 Starting Chunk Number:", startingChunkNumber);
    console.log("📍 Append Starting Index:", globalIndex);

    let lastUrl: string | null = null;

    while (true) {
      batchNumber++;

      // 2) Pull a batch from inventory
      let query = supabaseAdmin
        .from("shopify_url_inventory")
        .select("url,last_modified")
        .eq("is_active", true)
        .eq("is_indexable", true)
        .order("url", { ascending: true })
        .limit(BATCH_SIZE);

      if (lastUrl) query = query.gt("url", lastUrl);

      const { data: invBatch, error: invError } = await query;

      if (invError) {
        console.error(`❌ Inventory fetch error (batch ${batchNumber}):`, invError);
        return new NextResponse("Fetch error", { status: 500 });
      }

      if (!invBatch || invBatch.length === 0) {
        console.log("✅ No more inventory rows found.");
        break;
      }

      totalInventoryScanned += invBatch.length;

      // 3) Build url list for existence check
      const urls = invBatch.map((r) => r.url).filter(Boolean);

      // 4) Check which of these urls already exist in sitemap_chunks, in chunks of 1000
      const existing = new Set<string>();

      for (let i = 0; i < urls.length; i += EXISTS_CHECK_BATCH) {
        const slice = urls.slice(i, i + EXISTS_CHECK_BATCH);

        const { data: existsRows, error: existsError } = await supabaseAdmin
          .from("sitemap_chunks")
          .select("url")
          .in("url", slice);

        if (existsError) {
          console.error(`❌ Exists-check error (batch ${batchNumber}):`, existsError);
          return new NextResponse("Exists-check error", { status: 500 });
        }

        for (const row of existsRows ?? []) {
          if (row?.url) existing.add(row.url);
        }
      }

      // 5) Filter new urls (true incremental)
      const newRows = invBatch.filter((r) => r.url && !existing.has(r.url));
      totalNewDetected += newRows.length;

      console.log(
        `📦 Batch ${batchNumber}: Scanned ${invBatch.length}, Existing ${invBatch.length - newRows.length}, New ${newRows.length}`
      );

      if (newRows.length > 0) {
        const rowsToInsert = newRows.map((row, i) => {
          const rowNumber = globalIndex + i;
          return {
            chunk_number: Math.floor(rowNumber / CHUNK_SIZE),
            position: rowNumber % CHUNK_SIZE,
            url: row.url,
            last_modified: row.last_modified,
          };
        });

        const { error: insertError } = await supabaseAdmin
          .from("sitemap_chunks")
          .insert(rowsToInsert);

        if (insertError) {
          console.error(`❌ Insert error (batch ${batchNumber}):`, insertError);
          return new NextResponse("Insert error", { status: 500 });
        }

        globalIndex += newRows.length;
        totalInserted += newRows.length;

        console.log(`✅ Batch ${batchNumber}: Inserted ${newRows.length} URLs (Total ${totalInserted})`);
      }

      lastUrl = invBatch[invBatch.length - 1].url;

      // tiny pause for DB safety
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 6) Final chunk metrics
    const { data: finalRows, error: finalError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number, position")
      .order("chunk_number", { ascending: false })
      .order("position", { ascending: false })
      .limit(1);

    if (finalError) {
      console.error("⚠️ Could not read final chunk info:", finalError);
    }

    const finalChunkNumber = finalRows?.[0]?.chunk_number ?? startingChunkNumber;
    const chunksCreated = Math.max(0, finalChunkNumber - startingChunkNumber);

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("====================================================");
    console.log("🎉 INCREMENTAL SITEMAP REBUILD (SAFE) COMPLETE");
    console.log("📊 Total Inventory Scanned:", totalInventoryScanned);
    console.log("📊 Total New URLs Detected:", totalNewDetected);
    console.log("📊 Total URLs Inserted:", totalInserted);
    console.log("📦 Starting Chunk:", startingChunkNumber);
    console.log("📦 Final Chunk:", finalChunkNumber);
    console.log("📦 New Chunks Created:", chunksCreated);
    console.log("⏱ Duration (seconds):", durationSeconds);
    console.log("🕒 Finished At:", new Date().toISOString());
    console.log("====================================================");

    return new NextResponse(
      `Incremental rebuild complete. Inserted ${totalInserted} URLs. New chunks: ${chunksCreated}`
    );
  } catch (err: any) {
    console.error("💥 Server error during incremental rebuild:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}