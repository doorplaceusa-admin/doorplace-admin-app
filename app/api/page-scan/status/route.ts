import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const statuses = ["pending", "scanning", "done", "failed"];
  const result: any = {};

  for (const status of statuses) {
    const { count } = await supabaseAdmin
      .from("page_scan_jobs")
      .select("*", { count: "exact", head: true })
      .eq("scan_status", status);

    result[status] = count || 0;
  }

  return NextResponse.json(result);
}
