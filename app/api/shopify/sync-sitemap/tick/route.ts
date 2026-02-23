import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";
const BATCH_SIZE = 150;
const MAX_BATCHES_PER_TICK = 2;
const LOCK_SECONDS = 180; // increased to prevent overlapping ticks
const INCREMENTAL_SITEMAPS_TO_SCAN = 10;

const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;

type SitemapEntry = { loc?: string; lastmod?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function token() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function dedupeByUrl<T extends { url: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of rows) {
    if (!r?.url) continue;
    map.set(r.url, r);
  }
  return Array.from(map.values());
}

async function fetchWithRetry(
  url: string,
  retries = 8,
  baseDelay = 2000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "User-Agent": "TradePilot-SitemapSync/1.0",
          Accept: "application/xml,text/xml",
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res;
    } catch (err) {
      console.log(`❌ Fetch attempt ${attempt} failed for ${url}`);

      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts`);
      }

      // exponential backoff
      await sleep(baseDelay * attempt);
    }
  }

  throw new Error("Unreachable");
}

export async function POST(req: Request) {
  let lockToken: string | null = null;

  try {
    if (!SYNC_SECRET) {
      return NextResponse.json(
        { success: false, error: "Missing SITEMAP_SYNC_SECRET" },
        { status: 500 }
      );
    }

    const headerSecret = req.headers.get("x-sync-secret");
    if (headerSecret !== SYNC_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requestUrl = new URL(req.url);
    const mode = requestUrl.searchParams.get("mode") || "full"; // "full" | "incremental"

    lockToken = token();
    const job = await getJob();

    if (!job) {
      return NextResponse.json(
        { success: false, error: "No job row found" },
        { status: 500 }
      );
    }

    // 🔒 LOCK CHECK
    if (job.lock_expires_at && new Date(job.lock_expires_at) > new Date()) {
      return NextResponse.json({ success: true, locked: true });
    }

    // Acquire lock
    await updateJob({
      lock_token: lockToken,
      lock_expires_at: new Date(Date.now() + LOCK_SECONDS * 1000).toISOString(),
    });

    const currentJob = await getJob();

    // 🛑 If job not running, return status
    if (currentJob.status !== "running") {
      return NextResponse.json({
        success: true,
        status: currentJob.status,
        total_urls_processed: currentJob.total_urls_processed ?? 0,
        last_error: currentJob.last_error ?? null,
      });
    }

    // =========================
    // FETCH ROOT SITEMAP (RETRY SAFE)
    // =========================
    const indexRes = await fetchWithRetry(ROOT_SITEMAP);
    const indexXml = await indexRes.text();

    let sitemapUrls = extractLocs(indexXml);

    // ✅ incremental scans only last N sitemap files
    if (mode === "incremental") {
      sitemapUrls = sitemapUrls.slice(
        Math.max(0, sitemapUrls.length - INCREMENTAL_SITEMAPS_TO_SCAN)
      );
    }

    // keep total_sitemaps updated per mode run
    await updateJob({ total_sitemaps: sitemapUrls.length });

    // =========================
    // COMPLETE
    // =========================
    if (currentJob.sitemap_index >= sitemapUrls.length) {
      const nowIso = new Date().toISOString();

      if (mode === "incremental") {
        // ✅ For incremental: reset cursor, keep status running (or you can set completed if you want)
        await updateJob({
          sitemap_index: 0,
          url_offset: 0,
          updated_at: nowIso,
          // ✅ Elite mode: advance watermark after successful incremental run
          last_successful_sync_at: nowIso,
        });

        return NextResponse.json({
          success: true,
          done: true,
          incremental: true,
          total_urls_processed: currentJob.total_urls_processed ?? 0,
        });
      }

      // ✅ For full: mark completed + advance watermark
      await updateJob({
        status: "completed",
        finished_at: nowIso,
        last_successful_sync_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        done: true,
        total_urls_processed: currentJob.total_urls_processed ?? 0,
      });
    }

    // =========================
    // PROCESS CHILD SITEMAP
    // =========================
    const sitemapUrl = sitemapUrls[currentJob.sitemap_index];

let childXml: string;

try {
  const childRes = await fetchWithRetry(sitemapUrl);
  childXml = await childRes.text();

  // ✅ child fetch success → reset retry_count
  await updateJob({
    retry_count: 0,
    last_error: null,
  });

} catch (childError: any) {
  console.error("Child sitemap failed:", sitemapUrl);

  const retryCount = (currentJob.retry_count ?? 0) + 1;

  if (retryCount >= 5) {
    // 🚨 Only now fail job
    await updateJob({
      status: "failed",
      last_error: `Child sitemap failed after 5 attempts: ${sitemapUrl}`,
      retry_count: retryCount,
    });

    return NextResponse.json({
      success: false,
      status: "failed",
    });
  }

  // ✅ Soft retry (do NOT fail job)
  await updateJob({
    retry_count: retryCount,
    last_error: `Temporary child sitemap error (${retryCount}/5)`,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    retrying: true,
    retry_count: retryCount,
  });
}

    const entries = extractUrlEntries(childXml).filter(
      (e) => !!e.loc
    ) as { loc: string; lastmod?: string }[];

    let i = currentJob.url_offset;
    let upserted = 0;
    let batches = 0;

    // ✅ Elite watermark: only used in incremental mode
    const lastSync =
      mode === "incremental" && currentJob.last_successful_sync_at
        ? new Date(currentJob.last_successful_sync_at)
        : null;

    while (i < entries.length && batches < MAX_BATCHES_PER_TICK) {
      const slice = entries.slice(i, i + BATCH_SIZE);

      // ✅ Only filter by lastmod in incremental mode
      let rows = slice
        .filter((e) => {
          if (mode !== "incremental") return true; // full mode: take all
          if (!e.lastmod) return true; // safety: include if missing
          if (!lastSync) return true; // safety: include if no watermark
          return new Date(e.lastmod) > lastSync;
        })
        .map((e) => ({
          url: e.loc!.replace(/\/$/, "").toLowerCase(),
          page_type: "unknown",
          last_modified: e.lastmod ?? null,
          last_seen: new Date().toISOString(),
          is_active: true,
          source: "shopify_sitemap",
          updated_at: new Date().toISOString(),
        }));

      rows = dedupeByUrl(rows);

      // ✅ If nothing new in this slice (common in incremental), skip DB call
      if (rows.length > 0) {
        const { error } = await supabaseAdmin
          .from("shopify_url_inventory")
          .upsert(rows, { onConflict: "url" });

        if (error) {
          throw new Error(`Supabase upsert failed: ${error.message}`);
        }

        upserted += rows.length;
      }

      i += BATCH_SIZE;
      batches++;

      await sleep(500);
    }

    const doneWithSitemap = i >= entries.length;
    const newTotal = (currentJob.total_urls_processed ?? 0) + upserted;

    await updateJob({
  sitemap_index: doneWithSitemap
    ? currentJob.sitemap_index + 1
    : currentJob.sitemap_index,
  url_offset: doneWithSitemap ? 0 : i,
  total_urls_processed: newTotal,
  retry_count: 0, // ✅ RESET retry counter on success
  updated_at: new Date().toISOString(),
});

    return NextResponse.json({
      success: true,
      done: false,
      upserted,
      total_urls_processed: newTotal,
      sitemap_index: currentJob.sitemap_index,
      total_sitemaps: sitemapUrls.length, // report the mode-adjusted count
      mode,
    });
  } catch (e: any) {
    console.error("TICK ROUTE ERROR:", e);

    const job = await getJob();

const newRetryCount = (job.retry_count ?? 0) + 1;

if (newRetryCount >= 5) {
  await updateJob({
    status: "failed",
    last_error: e?.message ?? "Unknown error",
    retry_count: newRetryCount,
  });
} else {
  await updateJob({
    retry_count: newRetryCount,
    last_error: e?.message ?? "Temporary error — will retry",
  });
}

    return NextResponse.json(
      {
        success: false,
        status: "failed",
        error: e?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // 🔒 Only release lock if THIS request owns it
    if (lockToken) {
      const job = await getJob();
      if (job?.lock_token === lockToken) {
        await updateJob({
          lock_token: null,
          lock_expires_at: null,
        });
      }
    }
  }
}

/* ================= HELPERS ================= */

async function getJob() {
  const { data } = await supabaseAdmin
    .from("sitemap_sync_jobs")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

async function updateJob(patch: any) {
  const job = await getJob();
  if (!job) return;

  await supabaseAdmin.from("sitemap_sync_jobs").update(patch).eq("id", job.id);
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith("http"));
}

function extractUrlEntries(xml: string): SitemapEntry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((block) => ({
    loc: block[1].match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: block[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));
}