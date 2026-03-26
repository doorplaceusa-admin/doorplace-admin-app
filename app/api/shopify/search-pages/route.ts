import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

type ShopifyEdge = {
  cursor: string;
  node: {
    id: string;
    title: string;
    handle: string;
    updatedAt: string;
  };
};

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ pages: [] });
    }

    let allPages: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage && allPages.length < 250) {
      const gqlQuery = `
        {
          pages(first: 50, ${cursor ? `after: "${cursor}",` : ""} query: "title:*${query}* OR handle:*${query}*") {
            edges {
              cursor
              node {
                id
                title
                handle
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
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

      const json: any = await shopifyRes.json();

      const edges: ShopifyEdge[] = json.data.pages.edges;

      for (const e of edges) {
        allPages.push({
          id: e.node.id.replace("gid://shopify/Page/", ""),
          title: e.node.title,
          handle: e.node.handle,
          updatedAt: e.node.updatedAt,
        });
      }

      hasNextPage = json.data.pages.pageInfo.hasNextPage;
      cursor = edges.length ? edges[edges.length - 1].cursor : null;
    }

    return NextResponse.json({ pages: allPages });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}