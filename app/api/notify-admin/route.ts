import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const {
      type,
      title,
      body,
      entityType,
      entityId,
      companyId,
    } = await req.json();

    // Find admins
    const { data: admins, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (error) throw error;

    for (const admin of admins) {
      await supabaseAdmin.from("notifications").insert({
        user_id: admin.id,
        type,
        title,
        body: body ?? null,
        entity_type: entityType,
        entity_id: entityId,
        company_id: companyId,
        is_read: false,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notify-admin failed", err);
    return new NextResponse("Error", { status: 500 });
  }
}
