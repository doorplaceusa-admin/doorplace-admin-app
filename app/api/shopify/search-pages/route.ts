import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ pages: [] });
    }

    /* ============================================
       Shopify GraphQL Page Search
    ============================================ */

    const gqlQuery = `
      {
        pages(first: 10, query: "title:*${query}* OR handle:*${query}*") {
          edges {
            node {
              id
              title
              handle
              updatedAt
            }
          }
        }
      }
    `;

    const shopifyRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: gqlQuery }),
      }
    );

    if (!shopifyRes.ok) {
      throw new Error(await shopifyRes.text());
    }

    const json = await shopifyRes.json();

    const edges = json.data.pages.edges;

    const pages = edges.map((e: any) => ({
      id: e.node.id.replace("gid://shopify/Page/", ""), // ✅ clean numeric ID
      title: e.node.title,
      handle: e.node.handle,
      updatedAt: e.node.updatedAt,
    }));

    return NextResponse.json({ pages });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
