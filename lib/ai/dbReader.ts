import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * 🔒 READ-ONLY DATABASE ROUTER FOR ADMIN AI
 * - No inserts
 * - No updates
 * - No deletes
 * - No raw SQL
 */

type AllowedTable =
  | "leads"
  | "orders"
  | "generated_pages"
  | "existing_shopify_pages"
  | "page_view_events"
  | "profiles"
  | "partners"
  | "notifications"
  | "us_locations"
  | "commissions"

  // ✅ NEW SCANNER TABLES
  | "site_sitemap_urls"
  | "page_scan_jobs"
  | "page_scan_results";

type ReadOptions = {
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
};

export async function readTable(
  table: AllowedTable,
  options: ReadOptions = {}
) {
  const limit = options.limit ?? 200;
  const orderBy = options.orderBy ?? "created_at";
  const ascending = options.ascending ?? false;

  switch (table) {
    case "existing_shopify_pages":
      return supabaseAdmin
        .from("existing_shopify_pages")
        .select("slug, url, source, last_seen")
        .order("last_seen", { ascending: false })
        .limit(limit);

    case "leads":
      return supabaseAdmin
        .from("leads")
        .select("id, lead_type, city, state, created_at, partner_id, status")
        .order(orderBy, { ascending })
        .limit(limit);

    case "orders":
      return supabaseAdmin
        .from("orders")
        .select("id, order_status, total, deposit_paid, created_at, partner_id")
        .order(orderBy, { ascending })
        .limit(limit);

    case "generated_pages":
      return supabaseAdmin
        .from("generated_pages")
        .select("id, title, slug, page_type, city, state, created_at")
        .order(orderBy, { ascending })
        .limit(limit);

    case "page_view_events": {
  const sixHoursAgo = new Date(
    Date.now() - 6 * 60 * 60 * 1000
  ).toISOString();

  return supabaseAdmin
    .from("page_view_events")
    .select(`
      id,
      page_key,
      page_url,
      city,
      state,
      latitude,
      longitude,
      source,
      created_at
    `)
    .gte("created_at", sixHoursAgo)
    .order("created_at", { ascending: false })
    .limit(500);
}


    case "profiles":
      return supabaseAdmin
        .from("profiles")
        .select("id, role, email, active_company_id, created_at")
        .order(orderBy, { ascending })
        .limit(limit);

    case "partners":
      return supabaseAdmin
        .from("partners")
        .select("id, full_name, email, city, state, created_at, status")
        .order(orderBy, { ascending })
        .limit(limit);

    case "notifications":
      return supabaseAdmin
        .from("notifications")
        .select("id, type, created_at, is_read")
        .order(orderBy, { ascending })
        .limit(limit);

    case "us_locations":
      return supabaseAdmin
        .from("us_locations")
        .select("city_name, slug, state_id, population")
        .order("population", { ascending: false })
        .limit(limit);

    case "commissions":
      return supabaseAdmin
        .from("commissions")
        .select("id, partner_id, amount, status, created_at")
        .order(orderBy, { ascending })
        .limit(limit);

    /* ============================
       🔍 PAGE SCANNER TABLES
    ============================= */

    case "site_sitemap_urls":
      return supabaseAdmin
        .from("site_sitemap_urls")
        .select("id, page_url, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    case "page_scan_jobs":
      return supabaseAdmin
        .from("page_scan_jobs")
        .select("id, page_url, status, attempts, last_error, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    case "page_scan_results":
      return supabaseAdmin
        .from("page_scan_results")
        .select(
          "id, page_url, title, http_status, content_length, scanned_at"
        )
        .order("scanned_at", { ascending: false })
        .limit(limit);

    default:
      throw new Error("Table not allowed for AI access");
  }
}
