import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAdminNotification } from "@/lib/sendAdminNotification";

export async function POST() {
  try {
    // Pull all un-emailed notifications
    const { data: notifications, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .is("emailed_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    let sent = 0;

    for (const n of notifications) {
      await sendAdminNotification({
        type:
          n.type === "partner_message"
            ? "partner"
            : n.type === "lead_created"
            ? "lead"
            : "system",
        title: n.title,
        details: {
          notification_id: n.id,
          entity_type: n.entity_type,
          entity_id: n.entity_id,
          body: n.body,
          company_id: n.company_id,
          created_at: n.created_at,
        },
      });

      await supabaseAdmin
        .from("notifications")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", n.id);

      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("❌ Notification email processor failed:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
