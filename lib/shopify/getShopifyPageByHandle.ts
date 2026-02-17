/* ======================================================
   lib/shopify/getShopifyPageByHandle.ts
   ✅ Admin API Page Lookup by Handle
====================================================== */

type ShopifyPageNode = {
  id: string;
  title: string;
  handle: string;
};

/* ======================================================
   ✅ Admin GraphQL Fetch Helper
====================================================== */
async function shopifyAdminFetch({
  query,
  variables = {},
}: {
  query: string;
  variables?: Record<string, any>;
}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;

  if (!domain || !token) {
    throw new Error(
      "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env"
    );
  }

  const res = await fetch(
    `https://${domain}/admin/api/2024-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await res.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }

  return json;
}

/* ======================================================
   ✅ Get Shopify Page By Handle
====================================================== */
export async function getShopifyPageByHandle(
  handle: string
): Promise<ShopifyPageNode | null> {
  const query = `
    query GetPages($query: String!) {
      pages(first: 1, query: $query) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  const json = await shopifyAdminFetch({
    query,
    variables: {
      query: "handle:" + handle,
    },
  });

  return json.data.pages.edges[0]?.node || null;
}
