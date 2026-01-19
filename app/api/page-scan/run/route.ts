import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import * as cheerio from "cheerio";

/* =====================================================
   Fetch HTML with timing + status
===================================================== */
async function fetchHtml(url: string) {
  const start = Date.now();

  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "TradePilotBot/1.0",
      Accept: "text/html",
    },
  });

  const html = await res.text();

  return {
    html,
    status: res.status,
    duration: Date.now() - start,
  };
}

/* =====================================================
   Count internal vs external links (FIXED TYPES)
===================================================== */
function countInternalExternalLinks(
  $: cheerio.Root,
  baseHost: string
) {
  let internal = 0;
  let external = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const u = new URL(href, `https://${baseHost}`);
      if (u.hostname === baseHost) internal++;
      else external++;
    } catch {
      // ignore malformed URLs
    }
  });

  return { internal, external };
}

/* =====================================================
   API ROUTE
===================================================== */
export async function POST(req: Request) {
  let pageUrlForFail: string | null = null;

  try {
    const body = await req.json();
    const page_url: string = body.page_url;

    if (!page_url) {
      return NextResponse.json(
        { error: "Missing page_url" },
        { status: 400 }
      );
    }

    pageUrlForFail = page_url;

    /* ---------------------------------------------
       Mark job as scanning
    --------------------------------------------- */
    await supabaseAdmin
      .from("page_scan_jobs")
      .update({
        scan_status: "scanning",
        updated_at: new Date().toISOString(),
      })
      .eq("page_url", page_url);

    /* ---------------------------------------------
       Fetch + parse HTML
    --------------------------------------------- */
    const { html, status, duration } = await fetchHtml(page_url);
    const $ = cheerio.load(html);
    const host = new URL(page_url).hostname;

    /* ---------------------------------------------
       Extract SEO + content signals
    --------------------------------------------- */
    const title = $("title").first().text().trim() || null;

    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || null;

    const canonical =
      $('link[rel="canonical"]').attr("href") || null;

    const h1 = $("h1").first().text().trim() || null;
    const h2Count = $("h2").length;
    const h3Count = $("h3").length;

    const bodyText = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = bodyText ? bodyText.split(" ").length : 0;

    const images = $("img");
    const imageCount = images.length;

    let imagesWithAlt = 0;
    images.each((_, el) => {
      if ($(el).attr("alt")) imagesWithAlt++;
    });

    const { internal, external } =
      countInternalExternalLinks($, host);

    /* ---------------------------------------------
       Schema detection
    --------------------------------------------- */
    const schemaBlocks = $('script[type="application/ld+json"]');
    const hasSchema = schemaBlocks.length > 0;
    const schemaTypes: string[] = [];

    schemaBlocks.each((_, el) => {
      try {
        const json = JSON.parse($(el).text());
        const type = json["@type"];

        if (Array.isArray(type)) {
          type.forEach((t) => schemaTypes.push(t));
        } else if (typeof type === "string") {
          schemaTypes.push(type);
        }
      } catch {
        // ignore invalid JSON-LD
      }
    });

    /* ---------------------------------------------
       Save scan results
    --------------------------------------------- */
    await supabaseAdmin
      .from("page_scan_results")
      .upsert(
        {
          page_url,
          title,
          meta_description: metaDescription,
          canonical_url: canonical,
          h1,
          h2_count: h2Count,
          h3_count: h3Count,
          word_count: wordCount,
          image_count: imageCount,
          images_with_alt: imagesWithAlt,
          internal_link_count: internal,
          external_link_count: external,
          has_schema: hasSchema,
          schema_types:
            schemaTypes.length > 0
              ? Array.from(new Set(schemaTypes))
              : null,
          http_status: status,
          scan_duration_ms: duration,
          scanned_at: new Date().toISOString(),
        },
        { onConflict: "page_url" }
      );

    /* ---------------------------------------------
       Mark job done
    --------------------------------------------- */
    await supabaseAdmin
      .from("page_scan_jobs")
      .update({
        scan_status: "done",
        updated_at: new Date().toISOString(),
      })
      .eq("page_url", page_url);

    return NextResponse.json({
      success: true,
      page_url,
    });
  } catch (err: any) {
    if (pageUrlForFail) {
      await supabaseAdmin
        .from("page_scan_jobs")
        .update({
          scan_status: "failed",
          last_error: err?.message || "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("page_url", pageUrlForFail);
    }

    return NextResponse.json(
      { error: err?.message || "Scan failed" },
      { status: 500 }
    );
  }
}
