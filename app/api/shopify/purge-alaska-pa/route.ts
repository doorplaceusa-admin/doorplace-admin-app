import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

/* -----------------------------------------
   Shopify Fetch Helper
------------------------------------------ */
async function shopifyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}${path}`,
    {
      ...options,
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Shopify API Error:", res.status, text);
    throw new Error(`Shopify error ${res.status}`);
  }

  return res;
}

/* -----------------------------------------
   Sleep helper (rate limiting)
------------------------------------------ */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -----------------------------------------
   POST
------------------------------------------ */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  console.log("🚀 Starting Alaska-in-PA purge");
  console.log("🧪 Dry run:", dryRun);

  /* ============================================
     STEP 1 — Load Alaska Cities Contaminating PA
     Alaska longitude is usually < -120
  ============================================ */

  const { data: badCities, error } = await supabaseAdmin
    .from("us_locations")
    .select("city_name")
    .eq("state_id", "b542c24c-4600-476f-bca7-f511ff8ad8fd") // Pennsylvania ID
    .lt("longitude", -120);

  if (error) {
    console.error("❌ Failed to load Alaska cities:", error);
    return NextResponse.json({ success: false, error });
  }

  const alaskaCityNames = (badCities || []).map((c) =>
    c.city_name.toLowerCase()
  );

  console.log("⚠️ Alaska cities found inside PA:", alaskaCityNames.length);

  if (alaskaCityNames.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No Alaska contamination found inside PA",
    });
  }

  /* ============================================
     STEP 2 — Shopify Scan + Delete
  ============================================ */

  let checked = 0;
  let candidates = 0;
  let deleted = 0;

  let nextPageInfo: string | null = null;
  let pageBatch = 0;

  do {
    pageBatch++;

    console.log(`📦 Fetching Shopify page batch #${pageBatch}`);

    const pageRes = await shopifyFetch(
      `/pages.json?limit=250${
        nextPageInfo ? `&page_info=${nextPageInfo}` : ""
      }`
    );

    const data = await pageRes.json();
    const pages = data.pages || [];

    checked += pages.length;

    console.log(
      `🔎 Loaded ${pages.length} pages (checked so far: ${checked})`
    );

    for (const p of pages) {
      const title = (p.title || "").toLowerCase();

      // Only Pennsylvania-tagged pages
      if (!title.includes(", pa")) continue;

      // Check if title contains an Alaska city name
      const isAlaskaCity = alaskaCityNames.some((city) =>
        title.includes(city)
      );

      if (!isAlaskaCity) continue;

      candidates++;

      console.log(`👀 Candidate #${candidates}: ${p.title} (id: ${p.id})`);

      if (!dryRun) {
        console.log(`🗑️ Deleting page ${p.id}…`);

        await shopifyFetch(`/pages/${p.id}.json`, {
          method: "DELETE",
        });

        deleted++;

        console.log(`✅ Deleted ${deleted}/${candidates} — sleeping...`);

        await sleep(550);
      }
    }

    // Pagination
    const link = pageRes.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    nextPageInfo = match ? match[1] : null;

  } while (nextPageInfo);

  console.log("🎉 Alaska-in-PA purge complete");
  console.log("📊 Checked pages:", checked);
  console.log("📌 Candidates found:", candidates);
  console.log("🗑️ Pages deleted:", deleted);

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    checked_pages: checked,
    candidate_count: candidates,
    deleted_count: deleted,
  });
}
