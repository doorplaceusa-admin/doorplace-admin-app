import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  await runWorker(req);
  return NextResponse.json({ ok: true });
}

async function runWorker(req: Request) {
  while (true) {
    /* ---------------------------------------------
       1. Check global control flag
    --------------------------------------------- */
    const { data: control } = await supabaseAdmin
      .from("page_scan_control")
      .select("scanning_enabled")
      .single();

    if (!control?.scanning_enabled) {
      break;
    }

    /* ---------------------------------------------
       2. Get next pending job
    --------------------------------------------- */
    const { data: job } = await supabaseAdmin
      .from("page_scan_jobs")
      .select("*")
      .eq("scan_status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    // No jobs left → stop cleanly
    if (!job) {
      break;
    }

    /* ---------------------------------------------
       3. Mark scanning
    --------------------------------------------- */
    await supabaseAdmin
      .from("page_scan_jobs")
      .update({
        scan_status: "scanning",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    /* ---------------------------------------------
       4. Run scan
    --------------------------------------------- */
    try {
      await fetch(new URL("/api/page-scan/run", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_url: job.page_url }),
      });

      await supabaseAdmin
        .from("page_scan_jobs")
        .update({
          scan_status: "done",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } catch (err: any) {
      await supabaseAdmin
        .from("page_scan_jobs")
        .update({
          scan_status: "failed",
          last_error: err?.message || "Scan failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    /* ---------------------------------------------
       5. Small delay (prevents CPU lock + dev freeze)
    --------------------------------------------- */
    await new Promise((r) => setTimeout(r, 500));
  }
}
