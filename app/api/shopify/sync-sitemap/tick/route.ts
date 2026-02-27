import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";
const BATCH_SIZE = 150;
const MAX_BATCHES_PER_TICK = 2;
const LOCK_SECONDS = 180;
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

function withCacheBust(url: string) {
  const u = new URL(url);
  u.searchParams.set("_tp", `${Date.now()}_${Math.random().toString(16).slice(2)}`);
  return u.toString();
}

// ✅ Decode XML entities (this is the core fix)
function decodeXmlEntities(str: string) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isRetryableStatus(status: number) {
  // Retry on transient failures; do NOT retry 400 (usually bad URL)
  if (status === 400) return false;
  if (status === 404) return false;
  if (status === 429) return true;
  return status >= 500 && status <= 599;
}

// ✅ IMPORTANT: keep retries low per request to avoid nginx 504.
// Let the worker tick again rather than one request retrying forever.
async function fetchWithRetry(url: string, retries = 3) {
  let lastErr: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const tryUrl = withCacheBust(url);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(tryUrl, {
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/xml,text/xml,*/*;q=0.8",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        let snippet = "";
        try {
          const txt = await res.text();
          snippet = txt.slice(0, 180).replace(/\s+/g, " ").trim();
        } catch {}

        const msg = `HTTP ${res.status} for ${url}${snippet ? ` | ${snippet}` : ""}`;

        // Retry only if it’s actually retryable
        if (isRetryableStatus(res.status) && attempt < retries) {
          console.log(`❌ Fetch attempt ${attempt}/${retries} retryable: ${msg}`);
          await sleep(800 * attempt + Math.floor(Math.random() * 400));
          continue;
        }

        throw new Error(msg);
      }

      return res;
    } catch (err: any) {
      lastErr = err;
      const reason =
        err?.name === "AbortError" ? "TIMEOUT" : err?.message || String(err);

      console.log(`❌ Fetch attempt ${attempt}/${retries} failed for ${url}: ${reason}`);

      if (attempt === retries) break;

      await sleep(800 * attempt + Math.floor(Math.random() * 400));
    }
  }

  throw new Error(`Failed after ${retries} attempts: ${lastErr?.message ?? "Unknown error"}`);
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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requestUrl = new URL(req.url);
    const mode = (requestUrl.searchParams.get("mode") || "full") as "full" | "incremental";

    lockToken = token();
    const job = await getJob();
    if (!job) {
      return NextResponse.json({ success: false, error: "No job row found" }, { status: 500 });
    }

    // LOCK CHECK
    if (job.lock_expires_at && new Date(job.lock_expires_at) > new Date()) {
      return NextResponse.json({ success: true, locked: true });
    }

    // Acquire lock
    await updateJob({
      lock_token: lockToken,
      lock_expires_at: new Date(Date.now() + LOCK_SECONDS * 1000).toISOString(),
    });

    const currentJob = await getJob();

    if (currentJob.status !== "running") {
      return NextResponse.json({
        success: true,
        status: currentJob.status,
        total_urls_processed: currentJob.total_urls_processed ?? 0,
        last_error: currentJob.last_error ?? null,
      });
    }

    // =========================
    // FETCH ROOT SITEMAP (soft retry)
    // =========================
    let indexXml: string;
    try {
      const indexRes = await fetchWithRetry(ROOT_SITEMAP, 3);
      indexXml = await indexRes.text();
      await updateJob({ retry_count: 0, last_error: null });
    } catch (e: any) {
      const retryCount = (currentJob.retry_count ?? 0) + 1;

      await updateJob({
        retry_count: retryCount,
        last_error: `Root sitemap fetch failed (will retry): ${e?.message ?? "Unknown error"}`,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        retrying: true,
        where: "root_sitemap",
        retry_count: retryCount,
        error: e?.message ?? "Unknown error",
      });
    }

    let sitemapUrls = extractLocs(indexXml);

    if (mode === "incremental") {
      sitemapUrls = sitemapUrls.slice(Math.max(0, sitemapUrls.length - INCREMENTAL_SITEMAPS_TO_SCAN));
    }

    await updateJob({ total_sitemaps: sitemapUrls.length });

    // =========================
    // COMPLETE
    // =========================
    if (currentJob.sitemap_index >= sitemapUrls.length) {
      const nowIso = new Date().toISOString();

      if (mode === "incremental") {
        await updateJob({
          sitemap_index: 0,
          url_offset: 0,
          updated_at: nowIso,
          last_successful_sync_at: nowIso,
        });

        return NextResponse.json({
          success: true,
          done: true,
          incremental: true,
          total_urls_processed: currentJob.total_urls_processed ?? 0,
        });
      }

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
      const childRes = await fetchWithRetry(sitemapUrl, 3);
      childXml = await childRes.text();
      await updateJob({ retry_count: 0, last_error: null });
    } catch (childError: any) {
      const retryCount = (currentJob.retry_count ?? 0) + 1;

      await updateJob({
        retry_count: retryCount,
        last_error: `Child sitemap fetch failed (will retry): ${sitemapUrl} | ${childError?.message ?? "Unknown error"}`,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        retrying: true,
        where: "child_sitemap",
        sitemap_url: sitemapUrl,
        retry_count: retryCount,
      });
    }

    const entries = extractUrlEntries(childXml).filter((e) => !!e.loc) as {
      loc: string;
      lastmod?: string;
    }[];

    let i = currentJob.url_offset;
    let upserted = 0;
    let batches = 0;

    const lastSync =
      mode === "incremental" && currentJob.last_successful_sync_at
        ? new Date(currentJob.last_successful_sync_at)
        : null;

    while (i < entries.length && batches < MAX_BATCHES_PER_TICK) {
      const slice = entries.slice(i, i + BATCH_SIZE);

      let rows = slice
        .filter((e) => {
          if (mode !== "incremental") return true;
          if (!e.lastmod) return true;
          if (!lastSync) return true;
          return new Date(e.lastmod) > lastSync;
        })
        .map((e) => ({
          url: decodeXmlEntities(e.loc!).replace(/\/$/, "").toLowerCase(), // ✅ decode here too
          page_type: "unknown",
          last_modified: e.lastmod ?? null,
          last_seen: new Date().toISOString(),
          is_active: true,
          source: "shopify_sitemap",
          updated_at: new Date().toISOString(),
        }));

      rows = dedupeByUrl(rows);

      if (rows.length > 0) {
        const { error } = await supabaseAdmin
          .from("shopify_url_inventory")
          .upsert(rows, { onConflict: "url" });

        if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
        upserted += rows.length;
      }

      i += BATCH_SIZE;
      batches++;

      await sleep(300);
    }

    const doneWithSitemap = i >= entries.length;
    const newTotal = (currentJob.total_urls_processed ?? 0) + upserted;

    await updateJob({
      sitemap_index: doneWithSitemap ? currentJob.sitemap_index + 1 : currentJob.sitemap_index,
      url_offset: doneWithSitemap ? 0 : i,
      total_urls_processed: newTotal,
      retry_count: 0,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      done: false,
      upserted,
      total_urls_processed: newTotal,
      sitemap_index: currentJob.sitemap_index,
      total_sitemaps: sitemapUrls.length,
      mode,
    });
  } catch (e: any) {
    console.error("TICK ROUTE ERROR:", e);

    await updateJob({
      last_error: e?.message ?? "Unknown error",
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  } finally {
    if (lockToken) {
      const job = await getJob();
      if (job?.lock_token === lockToken) {
        await updateJob({ lock_token: null, lock_expires_at: null });
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
    .map((m) => decodeXmlEntities(m[1].trim())) // ✅ THIS fixes &amp;
    .filter((u) => u.startsWith("http"));
}

function extractUrlEntries(xml: string): SitemapEntry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((block) => ({
    loc: decodeXmlEntities(block[1].match(/<loc>(.*?)<\/loc>/)?.[1] ?? ""), // ✅ decode
    lastmod: block[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));
}