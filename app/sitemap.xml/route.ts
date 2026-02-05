export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ✅ Fetch Shopify sitemap directly
    const res = await fetch("https://tradepilot.doorplaceusa.com/sitemap.xml", {

      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(
        `Sitemap fetch failed: ${res.status}`,
        { status: 500 }
      );
    }

    const xml = await res.text();

    // ✅ Return XML directly (no redirect)
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",

      },
    });
  } catch (err) {
    return new Response("Error loading sitemap", { status: 500 });
  }
}
