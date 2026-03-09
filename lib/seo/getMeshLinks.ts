import { supabaseAdmin } from "@/lib/supabaseAdmin";

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

function randomLinkCount() {
  return Math.floor(Math.random() * 11) + 10;
}

export async function getMeshLinks(currentSlug: string): Promise<string[]> {

  const targetCount = randomLinkCount();

  const { data: inventory } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .or("url.ilike.%swing%,url.ilike.%swings%")
    .limit(500);

  if (!inventory || inventory.length === 0) {
    return [];
  }

  const pages = inventory.map((row) => extractHandle(row.url));

  const links: string[] = [];

  let cursor = Math.floor(Math.random() * pages.length);

  while (links.length < targetCount) {

    const index = cursor % pages.length;
    const candidate = pages[index];

    cursor++;

    if (candidate !== currentSlug && !links.includes(candidate)) {
      links.push(candidate);
    }

  }

  return links;
}