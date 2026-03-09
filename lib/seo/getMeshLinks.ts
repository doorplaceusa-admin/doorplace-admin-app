import { supabaseAdmin } from "@/lib/supabaseAdmin";

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

export async function getMeshLinks(currentSlug: string): Promise<string[]> {

  const LINK_COUNT = Math.floor(Math.random() * 11) + 10;

  /* -----------------------------------------
     LOAD CURRENT CURSOR POSITION
  ----------------------------------------- */

  const { data: rotation } = await supabaseAdmin
    .from("mesh_rotation_state")
    .select("cursor_position")
    .eq("id", 1)
    .single();

  let cursor = rotation?.cursor_position || 0;

  /* -----------------------------------------
     LOAD SMALL WINDOW OF URLS
  ----------------------------------------- */

  const { data: inventory } = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .order("url", { ascending: true })
    .range(cursor, cursor + 50);

  if (!inventory || inventory.length === 0) {
    return [];
  }

  const pages = inventory.map((r: any) => ({
    slug: extractHandle(r.url),
  }));

  const totalPages = pages.length;

  const links: string[] = [];

  /* -----------------------------------------
     BUILD LINK LIST
  ----------------------------------------- */

  while (links.length < LINK_COUNT) {

    const index = cursor % totalPages;
    const candidate = pages[index];

    cursor++;

    if (candidate.slug !== currentSlug) {
      links.push(candidate.slug);
    }

  }

  /* -----------------------------------------
     SAVE UPDATED CURSOR
  ----------------------------------------- */

  await supabaseAdmin
    .from("mesh_rotation_state")
    .update({
      cursor_position: cursor,
      updated_at: new Date(),
    })
    .eq("id", 1);

  return links;
}