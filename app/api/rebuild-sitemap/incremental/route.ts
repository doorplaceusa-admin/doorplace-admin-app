import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 5000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const SITEMAP_HOST = "https://tradepilot.doorplaceusa.com"; // ✅ adjust if needed

export async function GET() {
  const startTime = Date.now();

  let totalInserted = 0;
  let totalInventoryScanned = 0;
  let batchNumber = 0;

  try {
    console.log("====================================================");
    console.log("⚡ FAST INCREMENTAL SITEMAP UPDATE (SAFE) STARTED");
    console.log("🕒 Start Time:", new Date().toISOString());
    console.log("====================================================");

    // 0) Get append index (chunk_number/position max)
    const { data: lastPosRows, error: lastPosError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number, position")
      .order("chunk_number", { ascending: false })
      .order("position", { ascending: false })
      .limit(1);

    if (lastPosError) {
      console.error("❌ Failed reading last sitemap position:", lastPosError);
      return new NextResponse("Failed reading last sitemap position", { status: 500 });
    }

    let globalIndex = 0;
    let startingChunkNumber = 0;

    if (lastPosRows && lastPosRows.length > 0) {
      const last = lastPosRows[0];
      startingChunkNumber = last.chunk_number;
      globalIndex = last.chunk_number * CHUNK_SIZE + last.position + 1;
    }

    console.log("📍 Starting Chunk Number:", startingChunkNumber);
    console.log("📍 Append Starting Index:", globalIndex);

    // 1) Get the lexicographically greatest URL currently in sitemap_chunks
    const { data: lastUrlRows, error: lastUrlError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("url")
      .order("url", { ascending: false })
      .limit(1);

    if (lastUrlError) {
      console.error("❌ Failed reading last sitemap URL:", lastUrlError);
      return new NextResponse("Failed reading last sitemap URL", { status: 500 });
    }

    const lastSitemapUrl: string | null = lastUrlRows?.[0]?.url ?? null;

    console.log("🔚 Last Sitemap URL Boundary:", lastSitemapUrl ?? "(none)");

    // 2) Now only pull inventory rows AFTER that URL
    let lastInventoryUrl: string | null = null;

    while (true) {
      batchNumber++;

      let query = supabaseAdmin
        .from("shopify_url_inventory")
        .select("url,last_modified")
        .eq("is_active", true)
        .eq("is_indexable", true)
        .order("url", { ascending: true })
        .limit(BATCH_SIZE);

      // First boundary: greater than last sitemap URL
      if (lastSitemapUrl) query = query.gt("url", lastSitemapUrl);

      // Pagination boundary: greater than last fetched inventory url
      if (lastInventoryUrl) query = query.gt("url", lastInventoryUrl);

      const { data: invBatch, error: invError } = await query;

      if (invError) {
        console.error(`❌ Inventory fetch error (batch ${batchNumber}):`, invError);
        return new NextResponse("Fetch error", { status: 500 });
      }

      if (!invBatch || invBatch.length === 0) {
        console.log("✅ No more NEW inventory rows after boundary.");
        break;
      }

      totalInventoryScanned += invBatch.length;

      const rowsToInsert = invBatch
        .filter((r) => r.url)
        .map((row, i) => {
          const rowNumber = globalIndex + i;
          return {
            chunk_number: Math.floor(rowNumber / CHUNK_SIZE),
            position: rowNumber % CHUNK_SIZE,
            url: row.url,
            last_modified: row.last_modified,
          };
        });

      if (rowsToInsert.length === 0) {
        lastInventoryUrl = invBatch[invBatch.length - 1]?.url ?? lastInventoryUrl;
        continue;
      }

      // 3) Upsert to avoid duplicates if anything races
      const { error: upsertError } = await supabaseAdmin
        .from("sitemap_chunks")
        .upsert(rowsToInsert, { onConflict: "url", ignoreDuplicates: true });

      if (upsertError) {
        console.error(`❌ Upsert error (batch ${batchNumber}):`, upsertError);
        return new NextResponse("Upsert error", { status: 500 });
      }

      globalIndex += rowsToInsert.length;
      totalInserted += rowsToInsert.length;

      console.log(
        `✅ Batch ${batchNumber}: Inserted ${rowsToInsert.length} URLs (Total ${totalInserted})`
      );

      lastInventoryUrl = invBatch[invBatch.length - 1].url;

      await sleep(50);
    }

    // 4) Final chunk metrics (THIS is what the UI should use)
    const { data: finalPosRows, error: finalPosError } = await supabaseAdmin
      .from("sitemap_chunks")
      .select("chunk_number, position")
      .order("chunk_number", { ascending: false })
      .order("position", { ascending: false })
      .limit(1);

    if (finalPosError) {
      console.error("⚠️ Could not read final chunk info:", finalPosError);
    }

    const finalChunkNumber = finalPosRows?.[0]?.chunk_number ?? startingChunkNumber;
    const chunksCreated = Math.max(0, finalChunkNumber - startingChunkNumber);
    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    // ✅ FIX: correct URL format for "Open latest chunk"
    const latestChunkUrl = `${SITEMAP_HOST}/sitemap/${finalChunkNumber}.xml`;

    console.log("====================================================");
    console.log("🎉 FAST INCREMENTAL SITEMAP UPDATE (SAFE) COMPLETE");
    console.log("📊 Total NEW Inventory Scanned:", totalInventoryScanned);
    console.log("📊 Total URLs Upserted:", totalInserted);
    console.log("📦 Starting Chunk:", startingChunkNumber);
    console.log("📦 Final Chunk:", finalChunkNumber);
    console.log("📦 New Chunks Created:", chunksCreated);
    console.log("🔗 Latest Chunk URL:", latestChunkUrl);
    console.log("⏱ Duration (seconds):", durationSeconds);
    console.log("🕒 Finished At:", new Date().toISOString());
    console.log("====================================================");

    // ✅ Return JSON so the UI can reliably open the correct URL
    return NextResponse.json({
      ok: true,
      message: `Fast incremental update complete. Upserted ${totalInserted} new URLs. New chunks: ${chunksCreated}`,
      total_inventory_scanned: totalInventoryScanned,
      total_upserted: totalInserted,
      starting_chunk: startingChunkNumber,
      final_chunk: finalChunkNumber,
      new_chunks_created: chunksCreated,
      latest_chunk_url: latestChunkUrl, // ✅ THIS is what "Open latest chunk" should use
      duration_seconds: Number(durationSeconds),
      finished_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("💥 Server error during fast incremental update:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}