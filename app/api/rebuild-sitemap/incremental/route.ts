import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 5000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * FAST Incremental Sitemap Update (SAFE)
 *
 * Key idea:
 * - Find the last URL currently in sitemap_chunks (lexicographically max URL).
 * - Only scan inventory rows where url > lastSitemapUrl.
 * - Insert directly (no exists-check .in(), no huge query strings, no shrink loops).
 *
 * Assumptions:
 * - shopify_url_inventory has url ordered ASC available.
 * - sitemap_chunks already contains URLs in the same global url ordering
 *   (or at least the lexicographically greatest URL represents the append boundary).
 *
 * Safety:
 * - Uses UPSERT on url to avoid duplicates if anything races.
 * - Requires a unique index on sitemap_chunks(url) for best safety/performance.
 */
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

      // If something weird returns empty
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

    // 4) Final chunk metrics
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

    console.log("====================================================");
    console.log("🎉 FAST INCREMENTAL SITEMAP UPDATE (SAFE) COMPLETE");
    console.log("📊 Total NEW Inventory Scanned:", totalInventoryScanned);
    console.log("📊 Total URLs Upserted:", totalInserted);
    console.log("📦 Starting Chunk:", startingChunkNumber);
    console.log("📦 Final Chunk:", finalChunkNumber);
    console.log("📦 New Chunks Created:", chunksCreated);
    console.log("⏱ Duration (seconds):", durationSeconds);
    console.log("🕒 Finished At:", new Date().toISOString());
    console.log("====================================================");

    return new NextResponse(
      `Fast incremental update complete. Upserted ${totalInserted} new URLs. New chunks: ${chunksCreated}`
    );
  } catch (err: any) {
    console.error("💥 Server error during fast incremental update:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}