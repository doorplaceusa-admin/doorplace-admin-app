export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* -------------------------------------------------- */
/* SLEEP (Shopify rate control)                       */
/* -------------------------------------------------- */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -------------------------------------------------- */
/* SHOPIFY FETCH                                      */
/* -------------------------------------------------- */

async function shopifyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Shopify error ${res.status}`, text);
    throw new Error(text);
  }

  return res;
}

/* -------------------------------------------------- */
/* HELPERS                                            */
/* -------------------------------------------------- */

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

function parseLocationParts(slug: string) {
  const parts = slug.toLowerCase().split("-");

  if (parts.length < 2) {
    return { cityPart: "", stateCode: "" };
  }

  const stateCode = parts[parts.length - 1];
  const cityPart = parts.slice(0, parts.length - 1).join("-");

  return { cityPart, stateCode };
}

function detectTopic(slug: string) {
  const s = slug.toLowerCase();

  if (s.includes("white-oak")) return "white-oak";
  if (s.includes("red-oak")) return "red-oak";
  if (s.includes("oak")) return "oak";
  if (s.includes("cedar")) return "cedar";
  if (s.includes("pine")) return "pine";

  if (s.includes("daybed")) return "daybed";
  if (s.includes("farmhouse")) return "farmhouse";
  if (s.includes("patio")) return "patio";
  if (s.includes("garden")) return "garden";
  if (s.includes("backyard")) return "backyard";
  if (s.includes("front-yard")) return "front-yard";
  if (s.includes("front-porch")) return "front-porch";
  if (s.includes("adult")) return "adult";
  if (s.includes("bed-swing")) return "bed-swing";
  if (s.includes("porch-bed")) return "porch-bed";
  if (s.includes("heavy-duty")) return "heavy-duty";
  if (s.includes("high-weight-capacity")) return "high-weight-capacity";
  if (s.includes("solid-wood")) return "solid-wood";
  if (s.includes("outdoor")) return "outdoor";
  if (s.includes("custom")) return "custom";

  return "porch-swing";
}

function buildTopicPool(topic: string) {
  const map: Record<string, string[]> = {
    cedar: ["cedar", "outdoor", "custom", "porch-swing"],
    pine: ["pine", "custom", "porch-swing"],
    oak: ["oak", "red-oak", "white-oak", "solid-wood", "custom", "porch-swing"],
    "red-oak": ["red-oak", "oak", "solid-wood", "custom", "porch-swing"],
    "white-oak": ["white-oak", "oak", "solid-wood", "custom", "porch-swing"],
    daybed: ["daybed", "bed-swing", "porch-bed", "adult", "custom", "porch-swing"],
    farmhouse: ["farmhouse", "custom", "porch-swing"],
    patio: ["patio", "outdoor", "garden", "backyard", "porch-swing"],
    garden: ["garden", "patio", "backyard", "outdoor", "porch-swing"],
    backyard: ["backyard", "garden", "patio", "outdoor", "porch-swing"],
    "front-yard": ["front-yard", "front-porch", "outdoor", "porch-swing"],
    "front-porch": ["front-porch", "front-yard", "outdoor", "porch-swing"],
    adult: ["adult", "daybed", "high-weight-capacity", "heavy-duty", "porch-swing"],
    "bed-swing": ["bed-swing", "daybed", "porch-bed", "adult", "porch-swing"],
    "porch-bed": ["porch-bed", "bed-swing", "daybed", "adult", "porch-swing"],
    "heavy-duty": ["heavy-duty", "high-weight-capacity", "adult", "porch-swing"],
    "high-weight-capacity": ["high-weight-capacity", "heavy-duty", "adult", "porch-swing"],
    "solid-wood": ["solid-wood", "oak", "cedar", "pine", "custom", "porch-swing"],
    outdoor: ["outdoor", "patio", "garden", "backyard", "porch-swing"],
    custom: ["custom", "daybed", "farmhouse", "cedar", "pine", "oak", "porch-swing"],
    "porch-swing": ["porch-swing", "custom", "outdoor"],
  };

  return map[topic] || ["porch-swing", "custom", "outdoor"];
}

function dedupeUrls(urls: string[]) {
  return [...new Set(urls)];
}

/* -------------------------------------------------- */
/* GUIDE BLOCK                                        */
/* -------------------------------------------------- */

const GUIDE_BLOCK = `
<div class="tp-link-mesh" style="margin-top:45px; max-width:900px; margin-left:auto; margin-right:auto;">

  <h2 style="color:#b80d0d;">
    Porch Swing Guides
  </h2>

  <ul style="line-height:1.9;font-size:16px;">

    <li>
      <a href="https://doorplaceusa.com/pages/best-porch-swings" style="color:#b80d0d;">
        Best Porch Swings
      </a>
    </li>

    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-ideas" style="color:#b80d0d;">
        Porch Swing Ideas
      </a>
    </li>

    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-buying-guide" style="color:#b80d0d;">
        Porch Swing Buying Guide
      </a>
    </li>

    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-maintenance" style="color:#b80d0d;">
        Porch Swing Maintenance
      </a>
    </li>

    <li>
      <a href="https://doorplaceusa.com/pages/porch-swing-safety-guide" style="color:#b80d0d;">
        Porch Swing Safety Guide
      </a>
    </li>

  </ul>

</div>
`;

/* -------------------------------------------------- */
/* RELATED LINK FETCHER                               */
/* 10x STRONGER SEO:                                   */
/* - same topic first                                  */
/* - same state next                                   */
/* - same city-family fallback                         */
/* - broad fallback only if needed                     */
/* -------------------------------------------------- */

async function getRelatedUrlsForSlug(currentUrl: string, limit = 6) {
  const currentHandle = extractHandle(currentUrl);
  const topic = detectTopic(currentHandle);
  const topicPool = buildTopicPool(topic);

  const { cityPart, stateCode } = parseLocationParts(currentHandle);

  const collected: string[] = [];

  for (const topicTerm of topicPool) {
    if (collected.length >= limit) break;

    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", `%${topicTerm}%`)
      .ilike("url", `%${stateCode}`)
      .neq("url", currentUrl)
      .limit(12);

    for (const row of data || []) {
      const url = row.url as string;
      if (!collected.includes(url)) collected.push(url);
      if (collected.length >= limit) break;
    }
  }

  if (collected.length < limit && cityPart) {
    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", `%${cityPart}%`)
      .neq("url", currentUrl)
      .limit(20);

    for (const row of data || []) {
      const url = row.url as string;
      if (!collected.includes(url)) collected.push(url);
      if (collected.length >= limit) break;
    }
  }

  if (collected.length < limit) {
    const { data: pointer } = await supabaseAdmin
      .from("internal_link_pointer")
      .select("*")
      .eq("id", 1)
      .single();

    const linkOffset = pointer?.current_offset || 0;

    const { data } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .neq("url", currentUrl)
      .range(linkOffset, linkOffset + 24);

    for (const row of data || []) {
      const url = row.url as string;
      if (!collected.includes(url)) collected.push(url);
      if (collected.length >= limit) break;
    }
  }

  return dedupeUrls(collected).slice(0, limit);
}

/* -------------------------------------------------- */
/* MAIN ROUTE                                         */
/* -------------------------------------------------- */

export async function POST() {
  console.log("=======================================");
  console.log("🚀 SUPABASE LINK MESH STARTED");
  console.log("=======================================");

  let processed = 0;
  let updated = 0;

  try {
    const { data: pointer } = await supabaseAdmin
      .from("internal_link_pointer")
      .select("*")
      .eq("id", 1)
      .single();

    const offset = pointer?.current_offset || 0;

    const { data: pages } = await supabaseAdmin
      .from("shopify_url_inventory")
      .select("url")
      .ilike("url", "%porch-swing%")
      .range(offset, offset + 249);

    if (!pages || pages.length === 0) {
      console.log("❌ No pages found");

      return NextResponse.json({
        success: true,
        message: "No pages returned",
      });
    }

    console.log(`Loaded ${pages.length} pages from inventory`);

    for (const p of pages) {
      const currentUrl = p.url as string;
      const handle = extractHandle(currentUrl);

      processed++;

      const res = await shopifyFetch(`/pages.json?handle=${handle}`);
      const data = await res.json();
      const page = data.pages?.[0];

      if (!page) {
        console.log(`⚠️ Page not found: ${handle}`);
        continue;
      }

      const html = (page.body_html || "").toLowerCase();

      if (
        html.includes("porch swing guides") ||
        html.includes("explore more porch swings")
      ) {
        continue;
      }

      const relatedUrls = await getRelatedUrlsForSlug(currentUrl, 6);

      if (!relatedUrls || relatedUrls.length === 0) {
        console.log(`⚠️ No related URLs found: ${handle}`);
        continue;
      }

      const dynamicLinks = `
<div class="tp-link-mesh" style="margin-top:45px; max-width:900px; margin-left:auto; margin-right:auto;">

  <h2 style="color:#b80d0d;">
    Explore More Porch Swings
  </h2>

  <ul style="line-height:1.9;font-size:16px;">

    ${relatedUrls
      .map((url) => {
        const slug = extractHandle(url);

        return `
    <li>
      <a href="https://doorplaceusa.com/pages/${slug}" style="color:#b80d0d;">
        ${formatTitle(slug)}
      </a>
    </li>
    `;
      })
      .join("")}

  </ul>

</div>
`;

      let updatedHTML = page.body_html || "";

      const footerIndex = updatedHTML.toLowerCase().indexOf("</footer>");

      if (footerIndex !== -1) {
        updatedHTML =
          updatedHTML.slice(0, footerIndex) +
          GUIDE_BLOCK +
          dynamicLinks +
          updatedHTML.slice(footerIndex);
      } else {
        updatedHTML = updatedHTML + GUIDE_BLOCK + dynamicLinks;
      }

      await shopifyFetch(`/pages/${page.id}.json`, {
        method: "PUT",
        body: JSON.stringify({
          page: {
            id: page.id,
            body_html: updatedHTML,
          },
        }),
      });

      updated++;

      console.log(`✅ Updated ${handle}`);

      const { data: pointer2 } = await supabaseAdmin
        .from("internal_link_pointer")
        .select("*")
        .eq("id", 1)
        .single();

      const linkOffset = pointer2?.current_offset || 0;

      await supabaseAdmin
        .from("internal_link_pointer")
        .update({
          current_offset: linkOffset + 6,
        })
        .eq("id", 1);

      await sleep(350);
    }

    await supabaseAdmin
      .from("internal_link_pointer")
      .update({
        current_offset: offset + pages.length,
      })
      .eq("id", 1);

    console.log("=======================================");
    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log("=======================================");

    return NextResponse.json({
      success: true,
      processed,
      updated,
    });
  } catch (err: any) {
    console.error("❌ ERROR:", err.message);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}