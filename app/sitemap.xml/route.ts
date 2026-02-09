export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://doorplaceusa.com/sitemap.xml", {
      headers: {
        "User-Agent": "TradePilotBot/1.0 (+https://tradepilot.doorplaceusa.com)",
      },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return new Response(`Sitemap fetch failed: ${res.status}`, {
        status: 500,
      });
    }

    const xml = await res.text();

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response("Error loading sitemap", { status: 500 });
  }
}
