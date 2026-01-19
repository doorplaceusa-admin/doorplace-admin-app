import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ===============================
   CONFIG
================================ */
const BATCH_SIZE = 1000;     // safe range: 500–1000
const CONCURRENCY = 10;      // parallel scans
const MAX_LOOPS = 1000;      // hard safety cap

/* ===============================
   CONCURRENCY CONTROLLER
================================ */
async function runWithConcurrency(
  tasks: (() => Promise<any>)[],
  limit: number
) {
  const executing: Promise<any>[] = [];

  for (const task of tasks) {
    const p = task().finally(() => {
      executing.splice(executing.indexOf(p), 1);
    });

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

/* ===============================
   POST HANDLER
================================ */
export async function POST() {
  try {
    let totalProcessed = 0;

    for (let loop = 0; loop < MAX_LOOPS; loop++) {
      /* 1️⃣ Fetch next batch */
      const { data: jobs, error } = await supabaseAdmin
        .from("page_scan_jobs")
        .select("page_url")
        .eq("scan_status", "pending")
        .limit(BATCH_SIZE);

      if (error) throw error;

      /* 2️⃣ Stop when no jobs left */
      if (!jobs || jobs.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All jobs completed",
          totalProcessed,
        });
      }

      /* 3️⃣ Build scan tasks */
      const tasks = jobs.map((job) => () =>
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/page-scan/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_url: job.page_url }),
        })
      );

      /* 4️⃣ Run batch */
      await runWithConcurrency(tasks, CONCURRENCY);

      totalProcessed += jobs.length;
    }

    /* 5️⃣ Safety exit */
    return NextResponse.json({
      success: false,
      message: "Max loop limit reached",
      totalProcessed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Batch scan failed" },
      { status: 500 }
    );
  }
}
