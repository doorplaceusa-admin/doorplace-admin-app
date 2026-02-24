import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;
const BATCH_SIZE = 10000;

export async function GET() {
  try {
    console.log("Starting sitemap rebuild...");

    // Clear table
    await supabaseAdmin.from("sitemap_chunks").delete().neq("chunk_number", -1);

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
        return new NextResponse("Insert error", { status: 500 });
      }

      globalIndex += data.length;
      lastUrl = data[data.length - 1].url;

      console.log(`Processed ${globalIndex} rows...`);
    }

    console.log("Sitemap rebuild complete.");

    return new NextResponse("Rebuild complete");
  } catch (err: any) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}