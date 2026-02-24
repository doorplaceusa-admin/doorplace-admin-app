import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 5000;

export async function GET() {
  try {
    console.log("Starting sitemap rebuild...");


    // Clear table
   await supabaseAdmin.rpc("truncate_sitemap_chunks");

    let globalIndex = 0;
    let lastUrl: string | null = null;

    while (true) {
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
        console.error(error);

        await supabaseAdmin
          .from("sitemap_rebuild_status")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1);

        return new NextResponse("Fetch error", { status: 500 });
      }

      if (!data || data.length === 0) break;

      const rows = data.map((row, i) => {
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
        console.error(insertError);

        await supabaseAdmin
          .from("sitemap_rebuild_status")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1);

        return new NextResponse("Insert error", { status: 500 });
      }

      globalIndex += data.length;

      // small pause to avoid DB saturation
await new Promise((resolve) => setTimeout(resolve, 50));
      lastUrl = data[data.length - 1].url;

      console.log(`Processed ${globalIndex} rows...`);

      // 🔵 Update live progress
      await supabaseAdmin
        .from("sitemap_rebuild_status")
        .update({
          rows_processed: globalIndex,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
    }

    console.log("Sitemap rebuild complete.");

    // 🔵 Mark complete
    await supabaseAdmin
      .from("sitemap_rebuild_status")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return new NextResponse("Rebuild complete");
  } catch (err: any) {
    console.error(err);

    await supabaseAdmin
      .from("sitemap_rebuild_status")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return new NextResponse("Server error", { status: 500 });
  }
}