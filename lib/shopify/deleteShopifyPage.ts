export async function deleteShopifyPage(shopifyPageId: string | number) {
  if (!shopifyPageId) {
    throw new Error("Missing Shopify Page ID");
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;

  if (!domain || !token) {
    throw new Error("Missing Shopify env vars");
  }

  const url = `https://${domain}/admin/api/2024-01/pages/${shopifyPageId}.json`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify delete failed: ${res.status} ${text}`);
  }

  return true;
}
