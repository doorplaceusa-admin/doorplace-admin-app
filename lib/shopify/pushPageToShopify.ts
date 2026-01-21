import { buildTrackingScript } from "@/lib/templates/trackingScript";

const SHOPIFY_TEMPLATE_SUFFIX = "clean-default-notitle";

export async function pushPageToShopify(page: {
  page_id: string;
  title: string;
  slug: string;
  html: string;
  city: string;
  state: string;
  page_type: string;
}) {
  /* --------------------------------
     Build tracking script
  --------------------------------- */
  const tracking = buildTrackingScript({
    page_id: page.page_id,
    slug: page.slug,
    city: page.city,
    state: page.state,
    page_type: page.page_type,
  });

  /* --------------------------------
     Sanitize Shopify handle
  --------------------------------- */
  const handle = page.slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  /* --------------------------------
     Shopify Admin API endpoint
  --------------------------------- */
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/pages.json`;

  /* --------------------------------
     Create Shopify page
  --------------------------------- */
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
    },
    body: JSON.stringify({
      page: {
        title: page.title,
        handle,
        body_html: `${page.html}\n${tracking}`,

        // 🔒 FORCE correct template
        template_suffix: SHOPIFY_TEMPLATE_SUFFIX,

        // 👁 Visible immediately
        published_at: new Date().toISOString(),
      },
    }),
  });

  /* --------------------------------
     Read raw response
  --------------------------------- */
  const raw = await res.text();

  if (!res.ok) {
    console.error("❌ Shopify API error:", raw);
    throw new Error("Shopify API request failed");
  }

  /* --------------------------------
     Parse response
  --------------------------------- */
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("❌ Shopify returned invalid JSON:", raw);
    throw new Error("Invalid Shopify response");
  }

  if (!data?.page?.id) {
    console.error("❌ Shopify response missing page.id:", data);
    throw new Error("Shopify did not create page");
  }

  return data.page.id;
}
