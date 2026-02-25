import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 5000;

export async function GET() {
  const startTime = Date.now();

  let totalInserted = 0;
  let totalInventoryScanned = 0;
  let totalNewDetected = 0;
  let batchNumber = 0;

  try {
    console.log("====================================================");
    console.log("🚀 INCREMENTAL SITEMAP REBUILD STARTED");
    console.log("🕒 Start Time:", new Date().toISOString());
    console.log("====================================================");

    // 🔹 Get current last chunk info
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

    // 🔹 Get existing sitemap URLs
    const { data: existingUrls, error: urlError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("url");

    if (urlError) {
      console.error("❌ Failed reading existing URLs:", urlError);
      return new NextResponse("Failed reading existing URLs", { status: 500 });
    }

    const existingUrlSet = new Set(existingUrls?.map((u) => u.url));
    console.log("📊 Existing Sitemap URL Count:", existingUrlSet.size);

    let lastUrl: string | null = null;

    while (true) {
      batchNumber++;

      let query = supabaseAdmin
        .from("shopify_url_inventory")
        .select("url,last_modified")
        .eq("is_active", true)
        .eq("is_indexable", true)
        .order("url", { ascending: true })
        .limit(BATCH_SIZE);

      if (lastUrl) {
        query = query.gt("url", lastUrl);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ Fetch error in batch ${batchNumber}:`, error);
        return new NextResponse("Fetch error", { status: 500 });
      }

      if (!data || data.length === 0) {
        console.log("✅ No more inventory rows found.");
        break;
      }

      totalInventoryScanned += data.length;

      const newUrls = data.filter((row) => !existingUrlSet.has(row.url));
      totalNewDetected += newUrls.length;

      console.log(
        `📦 Batch ${batchNumber}: Scanned ${data.length}, New ${newUrls.length}`
      );

      if (newUrls.length > 0) {
        const rows = newUrls.map((row, i) => {
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
          .insert(rows);

        if (insertError) {
          console.error(`❌ Insert error in batch ${batchNumber}:`, insertError);
          return new NextResponse("Insert error", { status: 500 });
        }

        globalIndex += newUrls.length;
        totalInserted += newUrls.length;

        console.log(
          `✅ Batch ${batchNumber}: Inserted ${newUrls.length} URLs`
        );
      }

      lastUrl = data[data.length - 1].url;

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 🔹 Get final chunk info
    const { data: finalRows } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number")
      .order("chunk_number", { ascending: false })
      .limit(1);

    let finalChunkNumber = finalRows?.[0]?.chunk_number ?? 0;
    let chunksCreated = finalChunkNumber - startingChunkNumber;

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("====================================================");
    console.log("🎉 INCREMENTAL SITEMAP REBUILD COMPLETE");
    console.log("📊 Total Inventory Scanned:", totalInventoryScanned);
    console.log("📊 Total New URLs Detected:", totalNewDetected);
    console.log("📊 Total URLs Inserted:", totalInserted);
    console.log("📦 Starting Chunk:", startingChunkNumber);
    console.log("📦 Final Chunk:", finalChunkNumber);
    console.log("📦 New Chunks Created:", chunksCreated > 0 ? chunksCreated : 0);
    console.log("⏱ Duration (seconds):", durationSeconds);
    console.log("🕒 Finished At:", new Date().toISOString());
    console.log("====================================================");

    return new NextResponse(
      `Incremental rebuild complete. Inserted ${totalInserted} URLs. New chunks: ${chunksCreated > 0 ? chunksCreated : 0}`
    );
  } catch (err: any) {
    console.error("💥 Server error during incremental rebuild:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}