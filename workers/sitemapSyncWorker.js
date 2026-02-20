const SYNC_SECRET = process.env.SITEMAP_SYNC_SECRET;
const BASE_URL =
  process.env.APP_BASE_URL || "https://tradepilot.doorplaceusa.com";

if (!SYNC_SECRET) {
  console.error("❌ Missing SITEMAP_SYNC_SECRET");
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

  if (!res.ok) {
    throw new Error(text);
  }

  return JSON.parse(text);
}

async function main() {
  console.log("🚀 Sitemap Sync Worker started");
  console.log("🌐 Base URL:", BASE_URL);
  console.log("🕒", new Date().toISOString());
  console.log("--------------------------------------------------");

  while (true) {
    try {
      const data = await tick();

      // 🔒 Another worker lock
      if (data?.locked) {
        console.log("🔒 Tick skipped (another lock active)");
        await sleep(2000);
        continue;
      }

      // 🛑 Job not running
      if (data?.status && data.status !== "running") {
        console.log(`⏸ Job status: ${data.status}`);
        await sleep(3000);
        continue;
      }

      // 🎉 Finished
      if (data?.done) {
        console.log("🎉 Sitemap sync COMPLETED");
        console.log("🕒", new Date().toISOString());
        console.log("--------------------------------------------------");
        await sleep(15000);
        continue;
      }

      // 📦 Normal progress update
      if (data?.upserted !== undefined) {
        console.log(
          `📦 +${data.upserted} URLs | 🧮 Total: ${
            data.total_urls_processed?.toLocaleString() ?? "?"
          }`
        );
      }

      if (data?.sitemap_index !== undefined && data?.total_sitemaps) {
        console.log(
          `📊 Sitemap Progress: ${data.sitemap_index} / ${data.total_sitemaps}`
        );
      }

      await sleep(800);
    } catch (err) {
      console.error("🚨 Worker tick error:", err.message || err);
      await sleep(5000);
    }
  }
}

main();