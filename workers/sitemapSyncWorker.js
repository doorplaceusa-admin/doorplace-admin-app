const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;
const BASE_URL = process.env.APP_BASE_URL || "https://tradepilot.doorplaceusa.com";

if (!SYNC_SECRET) {
  console.error("Missing SITEMAP_SYNC_SECRET");
  process.exit(1);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tick() {
  const res = await fetch(`${BASE_URL}/api/shopify/sync-sitemap/tick`, {
    method: "POST",
    headers: {
      "x-sync-secret": SYNC_SECRET,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);

  const data = JSON.parse(text);
  return data;
}

async function main() {
  console.log("✅ Sitemap Sync Worker started:", new Date().toISOString());

  while (true) {
    try {
      const data = await tick();

      if (data?.done) {
        console.log("🎉 Sitemap sync completed.");
        await sleep(15000);
        continue;
      }

      // if locked by another instance, back off
      if (data?.locked) {
        await sleep(2000);
        continue;
      }

      // normal pace
      await sleep(800);
    } catch (err) {
      console.error("Worker tick error:", err.message || err);
      await sleep(5000);
    }
  }
}

main();