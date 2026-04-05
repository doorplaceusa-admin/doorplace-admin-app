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
      // 🔥 DEBUG LOG (optional but recommended)
      console.log("📧 PROCESSING NOTIFICATION:", {
        id: n.id,
        user_id: n.user_id,
        type: n.type,
      });

      // 🔥 SEND EMAIL
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
          created_at: n.created_at,
        },
      });

      // 🔥 MARK AS EMAILED (FIXED)
      const { error: updateError } = await supabaseAdmin
        .from("notifications")
        .update({
          emailed_at: new Date().toISOString(),
        })
        .eq("id", n.id)
        .eq("user_id", n.user_id); // ✅ IMPORTANT FIX

      if (updateError) {
        console.error("❌ FAILED TO UPDATE emailed_at:", updateError);
        continue;
      }

      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("❌ Notification email processor failed:", err);
    return new NextResponse("Error", { status: 500 });
  }
}