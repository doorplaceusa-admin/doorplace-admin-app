const SHOPIFY_API_VERSION = "2024-10";

export async function createShopifyPage({
  title,
  body_html,
  handle,
  template_suffix,
  meta_description,
}: {
  title: string;
  body_html: string;
  handle?: string;
  template_suffix?: string;
  meta_description?: string;
}) {
  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;

  if (!shop || !token) {
    throw new Error("Missing Shopify env vars");
  }

  const pagePayload: any = {
    title,
    body_html,
    handle,
    template_suffix: template_suffix || "clean-default-notitle",
    published: true,
  };

  // ✅ THIS is what fills the Shopify SEO box
  if (meta_description) {
    pagePayload.metafields = [
      {
        namespace: "global",
        key: "description_tag",
        type: "single_line_text_field",
        value: meta_description,
      },
    ];
  }

  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/pages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ page: pagePayload }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify create failed: ${text}`);
  }

  const json = await res.json();
  return json.page;
}
