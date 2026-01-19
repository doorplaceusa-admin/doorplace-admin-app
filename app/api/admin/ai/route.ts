import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* ======================================================
   HELPERS
====================================================== */

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isDoorPage(url: string) {
  return /door|doors|door-installation|iron-door|barn-door/.test(
    url.toLowerCase()
  );
}

function isSwingPage(url: string) {
  return /swing|porch-swing|crib-swing|twin-swing|custom-swing/.test(
    url.toLowerCase()
  );
}

function extractCityState(url: string) {
  const lower = url.toLowerCase();

  // city-state patterns
  const match =
    lower.match(/([a-z-]+)-(texas|tx)/) ||
    lower.match(/\/([a-z-]+)-([a-z]{2})\/?/);

  if (!match) return null;

  return {
    city: normalize(match[1]),
    state: normalize(match[2]),
  };
}

/* ======================================================
   ADMIN AI ROUTE
====================================================== */

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    /* ============================
       1. LOAD DOORPLACE USA PAGES
    ============================= */

    const { data: doorplacePages } = await supabaseAdmin
      .from("existing_shopify_pages")
      .select("url");

    const doorplaceSwingCities = new Set<string>();
    const doorplaceDoorCities = new Set<string>();

    doorplacePages?.forEach((p) => {
      const loc = extractCityState(p.url);
      if (!loc) return;

      const key = `${loc.city},${loc.state}`;

      if (isSwingPage(p.url)) {
        doorplaceSwingCities.add(key);
      }

      if (isDoorPage(p.url)) {
        doorplaceDoorCities.add(key);
      }
    });

    /* ============================
       2. LOAD ALL COMPETITOR PAGES
    ============================= */

    const { data: competitorUrls } = await supabaseAdmin
      .from("site_sitemap_urls")
      .select("page_url");

    const competitorSwingCities = new Set<string>();
    const competitorDoorCities = new Set<string>();

    competitorUrls?.forEach((p) => {
      const loc = extractCityState(p.page_url);
      if (!loc) return;

      const key = `${loc.city},${loc.state}`;

      if (isSwingPage(p.page_url)) {
        competitorSwingCities.add(key);
      }

      if (isDoorPage(p.page_url)) {
        competitorDoorCities.add(key);
      }
    });

    /* ============================
       3. COMPUTE GAPS (THE POINT)
    ============================= */

    // SWINGS = NATIONWIDE
    const missingSwingCities = [...competitorSwingCities].filter(
      (loc) => !doorplaceSwingCities.has(loc)
    );

    // DOORS = DFW ONLY
    const DFW_STATES = new Set(["texas", "tx"]);
    const missingDoorCities = [...competitorDoorCities].filter((loc) => {
      const [, state] = loc.split(",");
      return (
        DFW_STATES.has(state) && !doorplaceDoorCities.has(loc)
      );
    });

    /* ============================
       4. ASK OPENAI (EXPLAIN ONLY)
    ============================= */

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: `
You are TradePilot’s SEO Expansion AI for DoorPlace USA.

Rules:
- Swings are nationwide and prioritized
- Doors are ONLY for Dallas–Fort Worth, Texas
- Compare DoorPlace USA to ALL companies collectively
- Use computed gaps only
- Recommend URLs DoorPlace USA should create next
- Do NOT guess or hallucinate
`,
        },
        {
          role: "user",
          content: `
QUESTION:
${question}

MISSING SWING CITY PAGES (NATIONWIDE):
${JSON.stringify(missingSwingCities.slice(0, 100), null, 2)}

MISSING DOOR CITY PAGES (DFW ONLY):
${JSON.stringify(missingDoorCities.slice(0, 50), null, 2)}
`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,

      gaps: {
        swings: missingSwingCities,
        doors_dfw_only: missingDoorCities,
      },

      stats: {
        doorplace: {
          swing_city_pages: doorplaceSwingCities.size,
          door_city_pages_dfw: doorplaceDoorCities.size,
        },
        competitors: {
          swing_city_pages: competitorSwingCities.size,
          door_city_pages: competitorDoorCities.size,
        },
        missing: {
          swings: missingSwingCities.length,
          doors_dfw: missingDoorCities.length,
        },
      },
    });
  } catch (err) {
    console.error("ADMIN AI ERROR:", err);
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }
}
