
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { shopifyLimiter } from "@/lib/shopify/shopifyLimiter";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const MAX_RETRIES = 5;
const BATCH_SIZE = 25;

const SHOPIFY_DELAY_MS = 4000;
const JITTER_MS = 1200;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return SHOPIFY_DELAY_MS + Math.floor(Math.random() * JITTER_MS);
}

async function safeShopifyFetch(
  path: string,
  options: RequestInit = {}
) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await shopifyLimiter();

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

      if (res.status === 429) {
        console.log(`⏳ Shopify throttled attempt ${attempt}`);
        await sleep(2000 * attempt);
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        console.log("❌ Shopify error:", txt);
        await sleep(1500 * attempt);
        continue;
      }

      return res;
    } catch (err) {
      console.log("⚠️ Network error:", err);
      await sleep(2000 * attempt);
    }
  }

  return null;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

function extractHandle(urlString: string) {
  return urlString?.split("/").pop()?.trim() || "";
}

function formatCity(slug: string) {
  return slug
    .replace("automatic-barn-door-", "")
    .replace(/-\d.+$/, "")
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const introPool = [
  "SlideDrive™ allows homeowners to convert existing sliding barn doors into fully automatic systems without replacing the existing rail.",
  "Automatic barn door systems are becoming increasingly popular in modern homes, offices, and accessibility applications.",
  "SlideDrive™ is designed to automate existing sliding barn door systems using a compact low-profile drive system.",
  "Motorized sliding barn door systems allow doors to open and close automatically using powered drive technology.",
  "Many homeowners are upgrading existing barn doors with automatic systems for easier access and modern functionality."
];

const featurePool = [
  "Works with many existing barn door rail systems",
  "Compact floor-guide mounted design",
  "Powered drive wheel system",
  "Optional rack and pinion system",
  "Remote-control operation",
  "Optional motion activation",
  "Optional wall button controls",
  "Adjustable drive pressure",
  "Travel stop positioning system",
  "Optional smart-home integrations",
  "Low-profile installation design",
  "12V to 24V system configurations"
];

const faqPool = [
  {
    q: "Can SlideDrive™ work with existing barn doors?",
    a: "Yes. Many existing sliding barn doors can be upgraded using the SlideDrive™ automation system."
  },
  {
    q: "Does SlideDrive™ replace the top rail?",
    a: "No. The system is designed to work with many existing barn door rail systems already installed."
  },
  {
    q: "Can larger doors be automated?",
    a: "Yes. Larger and heavier doors may use upgraded drive configurations depending on the setup."
  },
  {
    q: "Can the system be battery powered?",
    a: "Optional rechargeable battery configurations may be available depending on the installation."
  },
  {
    q: "Can SlideDrive™ be used in commercial spaces?",
    a: "Yes. The system may be used in residential and commercial sliding door applications."
  },
  {
    q: "Does the system require ceiling mounting?",
    a: "No. The system operates near the lower guide area instead of using bulky overhead operators."
  }
];

const applicationPool = [
  "Closet sliding doors",
  "Laundry room entrances",
  "Office sliding doors",
  "Accessibility applications",
  "Pantry doors",
  "Modern residential interiors",
  "Commercial office spaces",
  "Creative studio spaces"
];

const semanticPool = [
  "automatic barn door system",
  "motorized sliding barn door",
  "electric sliding door system",
  "automatic sliding barn door opener",
  "smart barn door automation",
  "retrofit barn door automation",
  "hands-free sliding door system"
];

const ctaPool = [
  "Request a Custom Setup",
  "Request a Quote",
  "Get a SlideDrive™ Configuration",
  "Request Automatic Barn Door Pricing"
];

const internalLinks = [
  {
    title: "Automatic Barn Door System in Atlanta, GA",
    url: "/pages/automatic-barn-door-atlanta-ga-1304000-ga"
  },
  {
    title: "Automatic Barn Door System in Miami, FL",
    url: "/pages/automatic-barn-door-miami-fl-1245000-fl"
  },
  {
    title: "Automatic Barn Door System in Charlotte, NC",
    url: "/pages/automatic-barn-door-charlotte-nc-3712000-nc"
  },
  {
    title: "Automatic Barn Door System in Orlando, FL",
    url: "/pages/automatic-barn-door-orlando-fl-1253000-fl"
  },
  {
    title: "Automatic Barn Door System in Denver, CO",
    url: "/pages/automatic-barn-door-denver-co-820000-co"
  },
  {
    title: "Automatic Barn Door System in Phoenix, AZ",
    url: "/pages/automatic-barn-door-phoenix-az-455000-az"
  }
];

function buildPage(city: string) {
  const selectedFeatures = shuffleArray(featurePool).slice(0, 8);
  const selectedFaqs = shuffleArray(faqPool).slice(0, 5);
  const selectedApps = shuffleArray(applicationPool).slice(0, 6);
  const selectedLinks = shuffleArray(internalLinks).slice(0, 5);

  const intro1 = randomItem(introPool);
  const intro2 = randomItem(introPool);
  const intro3 = randomItem(introPool);

  const semantic1 = randomItem(semanticPool);
  const semantic2 = randomItem(semanticPool);

  const cta = randomItem(ctaPool);

  return `
<div style="max-width:1200px;margin:0 auto;padding:40px 20px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#222;">

<h1 style="font-size:42px;font-weight:800;margin-bottom:15px;">
Automatic Barn Door Opener in ${city}
</h1>

<h2 style="font-size:22px;color:#b80d0d;margin-bottom:25px;">
Upgrade Existing Sliding Barn Doors Into Fully Automatic Systems
</h2>

<p>${intro1}</p>
<p>${intro2}</p>
<p>${intro3}</p>

<p>
SlideDrive™ systems are designed for homeowners and businesses looking for a ${semantic1} without replacing the existing rail system.
</p>

<div style="margin:40px 0;">

<div style="font-size:20px;font-weight:bold;margin-bottom:15px;">
Watch SlideDrive™ in Action
</div>

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin-bottom:25px;">
<iframe src="https://www.youtube.com/embed/r5MtJb79esI?rel=0&amp;modestbranding=1&amp;playsinline=1"
frameborder="0"
allowfullscreen
style="position:absolute;top:0;left:0;width:100%;height:100%;">
</iframe>
</div>

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;">
<iframe src="https://www.youtube.com/embed/RGSK62chHlY?rel=0&amp;modestbranding=1&amp;playsinline=1"
frameborder="0"
allowfullscreen
style="position:absolute;top:0;left:0;width:100%;height:100%;">
</iframe>
</div>

</div>

<h2 style="margin-top:60px;">
Core Features
</h2>

<ul>
${selectedFeatures.map(f => `<li>${f}</li>`).join("")}
</ul>

<h2 style="margin-top:60px;">
Popular Applications
</h2>

<ul>
${selectedApps.map(a => `<li>${a}</li>`).join("")}
</ul>

<h2 style="margin-top:60px;">
About SlideDrive™
</h2>

<p>
Unlike large commercial automatic sliding systems, SlideDrive™ uses a compact powered drive configuration designed specifically for sliding barn doors.
</p>

<p>
The system may use either a powered friction wheel or upgraded rack-and-pinion configuration depending on door size, weight, and application requirements.
</p>

<p>
Many customers searching for a ${semantic2} are looking for ways to modernize existing sliding doors while preserving the overall appearance of the space.
</p>

<h2 style="margin-top:60px;">
Frequently Asked Questions
</h2>

${selectedFaqs.map(f => `
<div style="margin-bottom:25px;">
<h3 style="color:#b80d0d;">${f.q}</h3>
<p>${f.a}</p>
</div>
`).join("")}

<h2 style="margin-top:60px;">
Explore More Automatic Barn Door Systems
</h2>

<ul>
${selectedLinks.map(link => `
<li>
<a href="${link.url}">
${link.title}
</a>
</li>
`).join("")}
</ul>

<div style="margin-top:70px;text-align:center;padding:40px;background:#f8f8f8;border-radius:12px;">

<h2>
Get a Custom SlideDrive™ Setup
</h2>

<p>
Tell us about your sliding barn door and we’ll help recommend the correct SlideDrive™ setup for your application.
</p>

<a href="/pages/contact"
style="display:inline-block;padding:16px 32px;background:#b80d0d;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:20px;">
${cta}
</a>

</div>

</div>
`;
}

export async function POST() {
  console.log("🚀 STARTING AUTO BARN DOOR PAGE ENGINE");

  let offset = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const { data: inventory, error } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .or(
      "url.ilike.%automatic-barn-door%,url.ilike.%motorized-barn-door%,url.ilike.%sliding-door%"
    );

  if (error || !inventory) {
    return NextResponse.json({
      success: false,
      error: error?.message || "No inventory found"
    });
  }

  while (true) {
    const batch = inventory.slice(offset, offset + BATCH_SIZE);

    if (batch.length === 0) break;

    for (const row of batch) {
      try {
        const handle = extractHandle(row.url);

        if (!handle) {
          skipped++;
          continue;
        }

        console.log("🔍 Processing:", handle);

        const city = formatCity(handle);

        const findRes = await safeShopifyFetch(
          `/pages.json?handle=${handle}`
        );

        if (!findRes) {
          errors++;
          continue;
        }

        const findJson = await findRes.json();

        if (!findJson.pages?.length) {
          skipped++;
          continue;
        }

        const page = findJson.pages[0];

        const newHtml = buildPage(city);

        const updateRes = await safeShopifyFetch(
          `/pages/${page.id}.json`,
          {
            method: "PUT",
            body: JSON.stringify({
              page: {
                id: page.id,
                body_html: newHtml
              }
            })
          }
        );

        if (updateRes) {
          updated++;
          console.log("✅ Updated:", handle);
        } else {
          errors++;
        }

        await sleep(randomDelay());

      } catch (err) {
        console.log("❌ Worker error:", err);
        errors++;
      }
    }

    offset += BATCH_SIZE;
  }

  console.log("🎯 AUTO BARN DOOR ENGINE COMPLETE");

  return NextResponse.json({
    success: true,
    updated,
    skipped,
    errors
  });
}

