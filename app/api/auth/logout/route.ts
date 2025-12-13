import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST() {
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
