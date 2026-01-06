import { supabase } from "@/lib/supabaseClient";

type AdminNotificationInput = {
  type: string;              // e.g. "lead_converted_to_order"
  title: string;             // short title for UI
  body?: string;             // optional description
  entityType: string;        // "lead", "partner", etc
  entityId: string;          // ID of the related record
  companyId: string;         // company scope
};

export async function notifyAdmin({
  type,
  title,
  body,
  entityType,
  entityId,
  companyId,
}: AdminNotificationInput) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      type,
      title,
      body: body ?? null,
      entity_type: entityType,
      entity_id: entityId,
      company_id: companyId,
      is_read: false,
    });

  if (error) {
    console.error("Admin notification failed:", error);
  }
}
