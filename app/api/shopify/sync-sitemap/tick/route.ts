import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROOT_SITEMAP = "https://doorplaceusa.com/sitemap.xml";
const BATCH_SIZE = 500;
const MAX_BATCHES_PER_TICK = 3;
const LOCK_SECONDS = 60;

const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;

type SitemapEntry = { loc?: string; lastmod?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function token() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function POST(req: Request) {
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

  const lockToken = token();
  const job = await getJob();

  if (!job) {
    return NextResponse.json({ success: false, error: "No job row found" });
  }

  // 🔒 Lock check
  if (job.lock_expires_at && new Date(job.lock_expires_at) > new Date()) {
    return NextResponse.json({ success: true, locked: true });
  }

  await updateJob({
    lock_token: lockToken,
    lock_expires_at: new Date(Date.now() + LOCK_SECONDS * 1000).toISOString(),
  });

  try {
    const currentJob = await getJob();

    if (currentJob.status !== "running") {
      return NextResponse.json({
        success: true,
        status: currentJob.status,
        total_urls_processed: currentJob.total_urls_processed ?? 0,
      });
    }

    const indexRes = await fetch(ROOT_SITEMAP, {
      cache: "no-store",
      headers: { "User-Agent": "DoorplaceUSA-SitemapSync/1.0" },
    });

    const indexXml = await indexRes.text();
    const sitemapUrls = extractLocs(indexXml);

    if (!currentJob.total_sitemaps) {
      await updateJob({ total_sitemaps: sitemapUrls.length });
    }

    if (currentJob.sitemap_index >= sitemapUrls.length) {
      await updateJob({
        status: "completed",
        finished_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        done: true,
        total_urls_processed: currentJob.total_urls_processed ?? 0,
      });
    }

    const sitemapUrl = sitemapUrls[currentJob.sitemap_index];
    const childRes = await fetch(sitemapUrl, { cache: "no-store" });

    const childXml = await childRes.text();
    const entries = extractUrlEntries(childXml).filter(
      (e) => !!e.loc
    ) as { loc: string; lastmod?: string }[];

    let i = currentJob.url_offset;
    let upserted = 0;
    let batches = 0;

    while (i < entries.length && batches < MAX_BATCHES_PER_TICK) {
      const slice = entries.slice(i, i + BATCH_SIZE);

      const rows = slice.map((e) => ({
        url: e.loc!.replace(/\/$/, "").toLowerCase(),
        page_type: "unknown",
        last_modified: e.lastmod ?? null,
        last_seen: new Date().toISOString(),
        is_active: true,
        source: "shopify_sitemap",
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabaseAdmin
        .from("shopify_url_inventory")
        .upsert(rows, { onConflict: "url" });

      if (error) throw error;

      upserted += rows.length;
      i += BATCH_SIZE;
      batches++;

      await sleep(500);
    }

    const doneWithSitemap = i >= entries.length;

    const newTotal =
      (currentJob.total_urls_processed ?? 0) + upserted;

    await updateJob({
      sitemap_index: doneWithSitemap
        ? currentJob.sitemap_index + 1
        : currentJob.sitemap_index,
      url_offset: doneWithSitemap ? 0 : i,
      total_urls_processed: newTotal,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      done: false,
      upserted,
      total_urls_processed: newTotal,
      sitemap_index: currentJob.sitemap_index,
      total_sitemaps: currentJob.total_sitemaps,
    });

  } catch (e: any) {
    await updateJob({
      status: "failed",
      last_error: e.message,
    });

    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  } finally {
    await updateJob({
      lock_token: null,
      lock_expires_at: null,
    });
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

  await supabaseAdmin
    .from("sitemap_sync_jobs")
    .update(patch)
    .eq("id", job.id);
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