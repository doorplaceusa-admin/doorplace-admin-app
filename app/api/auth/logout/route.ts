import { NextResponse } from "next/server";
import { createClientHelper } from "@/lib/supabaseClient";

export async function POST() {
  const supabase = createClientHelper();

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}

