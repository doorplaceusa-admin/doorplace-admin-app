import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COMMON_SITEMAPS = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
  "/sitemaps/sitemap.xml",
  "/sitemaps/sitemap-index.xml",
];

/* ===============================
   HELPERS
================================ */

function normalizeDomain(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function normalizePath(url: string) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return null;
  }
}

function pathDepth(url: string) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).length;
  } catch {
    return null;
  }
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "TradePilot Sitemap Scanner",
      Accept: "application/xml,text/xml,text/plain",
    },
  });
  if (!res.ok) throw new Error(`Failed fetch ${url}`);
  return res.text();
}

function extractBlocks(xml: string) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
}

function extractTag(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

/* 🔑 Deduplicate rows by page_url */
function dedupeByPageUrl(rows: any[]) {
  return Array.from(
    new Map(rows.map(r => [r.page_url, r])).values()
  );
}

/* ===============================
   POST
================================ */

export async function POST(req: Request) {
  try {
    const { input_url, company_name, is_internal } = await req.json();

    if (!input_url || !company_name) {
      return NextResponse.json(
        { error: "Missing input_url or company_name" },
        { status: 400 }
      );
    }

    const scan_run_id = crypto.randomUUID();
    const root_domain = normalizeDomain(input_url);
    const base = input_url.replace(/\/$/, "");

    let sitemapUrls: string[] = [];
    let totalUrlsFound = 0; // ✅ FIX: counter

    /* -------------------------------
       ROBOTS.TXT DISCOVERY
    -------------------------------- */
    try {
      const robots = await fetchText(`${base}/robots.txt`);
      const matches = robots.match(/Sitemap:\s*(.*)/gi);
      if (matches) {
        sitemapUrls.push(
          ...matches.map(m =>
            m.split(":").slice(1).join(":").trim()
          )
        );
      }
    } catch {
      // robots.txt optional
    }

    /* -------------------------------
       COMMON FALLBACK SITEMAPS
    -------------------------------- */
    COMMON_SITEMAPS.forEach(p => sitemapUrls.push(`${base}${p}`));
    sitemapUrls = [...new Set(sitemapUrls)];

    const CHUNK_SIZE = 100;
    let buffer: any[] = [];

    /* -------------------------------
       SAFE FLUSH
    -------------------------------- */
    async function flush() {
      if (!buffer.length) return;

      const deduped = dedupeByPageUrl(buffer);

      const { error } = await supabaseAdmin
        .from("site_sitemap_urls")
        .upsert(deduped, { onConflict: "page_url" });

      if (error) throw error;

      buffer = [];
    }

    /* -------------------------------
       SITEMAP SCAN
    -------------------------------- */
    for (const sitemapUrl of sitemapUrls) {
      let xml: string;

      try {
        xml = await fetchText(sitemapUrl);
      } catch {
        continue;
      }

      const isIndex = xml.includes("<sitemapindex");
      const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
      const childSitemaps = isIndex ? locs : [sitemapUrl];

      for (const sm of childSitemaps) {
        let smXml: string;

        try {
          smXml = isIndex ? await fetchText(sm) : xml;
        } catch {
          continue;
        }

        for (const block of extractBlocks(smXml)) {
          const pageUrl = extractTag(block, "loc");
          if (!pageUrl) continue;

          totalUrlsFound++; // ✅ FIX: increment count

          buffer.push({
            company_name,
            root_domain,
            input_url,
            is_internal: !!is_internal,

            page_url: pageUrl,
            normalized_path: normalizePath(pageUrl),
            path_depth: pathDepth(pageUrl),

            sitemap_source_urls: [sm],
            lastmod: extractTag(block, "lastmod"),
            changefreq: extractTag(block, "changefreq"),
            priority: extractTag(block, "priority"),

            scan_run_id,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (buffer.length >= CHUNK_SIZE) {
            await flush();
          }
        }
      }
    }

    await flush();

    /* -------------------------------
       RESPONSE (FIXED)
    -------------------------------- */
    return NextResponse.json({
      success: true,
      root_domain,
      scan_run_id,
      scanned_urls: totalUrlsFound, // ✅ FIX: UI now shows number
    });

  } catch (err: any) {
    console.error("SITEMAP SCAN ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Scan failed" },
      { status: 500 }
    );
  }
}
