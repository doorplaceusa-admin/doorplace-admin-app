import { createClient } from "@supabase/supabase-js";

/* ======================================================
   SUPABASE ADMIN CLIENT (SERVICE ROLE)
   - Server-only
   - Bypasses RLS
   - Never depends on user session
====================================================== */

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("❌ Missing Supabase admin environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
