/**
 * STEP 2 — EXPORT ALL PARTNER CUSTOMERS (CORRECT + SAFE)
 *
 * Output:
 * - shopify_partners_export.json
 */

import "dotenv/config";
import fs from "fs";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
  throw new Error("Missing Shopify env variables");
}

const API_VERSION = "2024-01";
const LIMIT = 250;
const OUTPUT_FILE = "./shopify_partners_export.json";

async function fetchAllPartners() {
  let pageInfo = null;
  let page = 0;

  const partnerMap = new Map(); // ✅ dedupe by customer ID

  console.log("Starting Shopify partner export…");

  while (true) {
    page++;

    const url = pageInfo
      ? `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${API_VERSION}/customers.json?limit=${LIMIT}&page_info=${pageInfo}`
      : `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${API_VERSION}/customers.json?limit=${LIMIT}`;

    console.log(`Fetching page ${page}…`);

    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`Shopify API error: ${res.status}`);
    }

    const data = await res.json();

    if (!data.customers || data.customers.length === 0) {
      console.log("No customers returned — stopping.");
      break;
    }

    // ✅ Filter + dedupe PARTNERS ONLY
    for (const customer of data.customers) {
      if (customer.tags?.toLowerCase().includes("partner")) {
        partnerMap.set(customer.id, customer);
      }
    }

    // ✅ Pagination: ONLY continue if Shopify provides next page
    const linkHeader = res.headers.get("link");
    const nextMatch = linkHeader?.match(/<[^>]+page_info=([^&>]+)[^>]*>; rel="next"/);

    if (!nextMatch) {
      console.log("No next page — finished.");
      break;
    }

    pageInfo = nextMatch[1];
  }

  const partners = Array.from(partnerMap.values());

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(partners, null, 2),
    "utf-8"
  );

  console.log("STEP 2 COMPLETE");
  console.log("Total partner records exported:", partners.length);
  console.log("File written to:", OUTPUT_FILE);
}

fetchAllPartners().catch(err => {
  console.error("STEP 2 FAILED:", err);
});
