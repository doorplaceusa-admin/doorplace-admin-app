import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("NOTIFICATION READ ERROR:", err);
    return NextResponse.json(
      { error: "Failed to mark read" },
      { status: 500 }
    );
  }
}
