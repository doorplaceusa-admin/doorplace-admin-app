/**
 * STEP 1 — FETCH SHOPIFY PARTNER CUSTOMERS ONLY
 * Filters strictly by tag: "partner"
 */



import "dotenv/config";
const SHOPIFY_STORE = process.env.SHOPIFY_STORE; // example: doorplaceusa
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
  throw new Error("Missing Shopify env variables");
}

const BASE_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/customers.json`;

async function fetchAllPartnerCustomers() {
  let partners = [];
  let nextPageUrl = `${BASE_URL}?limit=250&tag=partner`;

  while (nextPageUrl) {
    const res = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Shopify API error: ${res.statusText}`);
    }

    const data = await res.json();

    for (const customer of data.customers) {
      // EXTRA SAFETY CHECK
      const tags = customer.tags
        ? customer.tags.split(",").map(t => t.trim())
        : [];

      if (!tags.includes("partner")) continue;

      partners.push({
        shopify_customer_id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        sms_opt_in: customer.sms_marketing_consent?.state === "subscribed",
        address: customer.default_address || null,
        note: customer.note || "",
        tags: customer.tags,
      });
    }

    // Pagination
    const linkHeader = res.headers.get("link");
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextPageUrl = match ? match[1] : null;
    } else {
      nextPageUrl = null;
    }
  }

  return partners;
}

(async () => {
  try {
    const partners = await fetchAllPartnerCustomers();

    console.log("STEP 1 COMPLETE");
    console.log("Total Shopify PARTNER customers:", partners.length);

    if (partners.length > 0) {
      console.log("SAMPLE PARTNER RECORD:");
      console.log(partners[0]);
    }
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
})();
