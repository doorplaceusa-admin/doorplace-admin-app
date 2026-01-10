import { buildTrackingScript } from "@/lib/templates/trackingScript";

export async function pushPageToShopify(page: {
  page_id: string;
  title: string;
  slug: string;
  html: string;
  city: string;
  state: string;
  page_type: string;
}) {
  const tracking = buildTrackingScript({
    page_id: page.page_id,
    slug: page.slug,
    city: page.city,
    state: page.state,
    page_type: page.page_type,
  });

  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/pages.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
    },
    body: JSON.stringify({
      page: {
  title: page.title,
  handle: page.slug,
  published: true,
  body_html: `${page.html}\n${tracking}`,
  template_suffix: "clean-default-notitle"
},

    }),
  });

  const text = await res.text(); // 👈 ALWAYS read raw first

  if (!res.ok) {
    console.error("Shopify API error:", text);
    throw new Error("Shopify API failed — check server logs");
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Invalid JSON from Shopify:", text);
    throw new Error("Shopify returned non-JSON response");
  }

  if (!data?.page?.id) {
    console.error("Shopify response missing page.id:", data);
    throw new Error("Shopify did not return page ID");
  }

  return data.page.id;
}
