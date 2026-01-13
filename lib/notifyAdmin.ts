// lib/notifyAdmin.ts
import { supabase } from "@/lib/supabaseClient";

export async function notifyAdmin({
  type,
  title,
  body,
  entityType,
  entityId,
  companyId,
}: {
  type: string;
  title: string;
  body?: string;
  entityType: string;
  entityId: string;
  companyId: string;
}) {
  await supabase.from("notifications").insert({
    type,
    title,
    body: body ?? null,
    entity_type: entityType,
    entity_id: entityId,
    company_id: companyId,
    is_read: false,
  });
}
