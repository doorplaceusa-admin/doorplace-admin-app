import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * 📊 PAGE SCANNER AGGREGATE INTELLIGENCE
 * READ-ONLY — used by Admin AI only
 */

export async function getPageScanOverview() {
  // 1️⃣ Sitemap totals
  const { count: sitemapTotal } = await supabaseAdmin
    .from("site_sitemap_urls")
    .select("*", { count: "exact", head: true });

  // 2️⃣ Job totals by status
  const { data: jobStats } = await supabaseAdmin
    .from("page_scan_jobs")
    .select("status");

  const jobCounts = {
    pending: 0,
    scanning: 0,
    done: 0,
    failed: 0,
  };

  jobStats?.forEach((j) => {
    if (j.status in jobCounts) {
      jobCounts[j.status as keyof typeof jobCounts]++;
    }
  });

  // 3️⃣ Scan results
  const { count: resultsTotal } = await supabaseAdmin
    .from("page_scan_results")
    .select("*", { count: "exact", head: true });

  const { data: failedResults } = await supabaseAdmin
    .from("page_scan_results")
    .select("http_status")
    .gte("http_status", 400);

  return {
    sitemap_total_urls: sitemapTotal ?? 0,

    scan_jobs: {
      total:
        jobCounts.pending +
        jobCounts.scanning +
        jobCounts.done +
        jobCounts.failed,
      ...jobCounts,
    },

    scan_results: {
      total: resultsTotal ?? 0,
      failed: failedResults?.length ?? 0,
      success: (resultsTotal ?? 0) - (failedResults?.length ?? 0),
    },

    derived_metrics: {
      sitemap_to_job_gap:
        (sitemapTotal ?? 0) -
        (jobCounts.pending +
          jobCounts.scanning +
          jobCounts.done +
          jobCounts.failed),

      completion_rate:
        jobCounts.done === 0
          ? 0
          : Math.round(
              (jobCounts.done /
                (jobCounts.pending +
                  jobCounts.scanning +
                  jobCounts.done +
                  jobCounts.failed)) *
                100
            ),
    },
  };
}
