import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanPhone(phone: string | null) {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  if (digits.length === 10) {
    return digits;
  }

  return null;
}

export async function GET() {
  const { data: events, error } = await supabaseAdmin
    .from("iplum_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  // 🔥 NEW: attach lead data
  const enriched = await Promise.all(
    (events || []).map(async (event) => {
      const rawPhone = event.from_number || event.to_number || null;
      const cleanedPhone = cleanPhone(rawPhone);

      let lead = null;

      if (cleanedPhone) {
        const { data } = await supabaseAdmin
          .from("leads")
          .select("*")
          .eq("phone_clean", cleanedPhone)
          .maybeSingle();

        lead = data;
      }

      console.log("CALL:", rawPhone);
      console.log("CLEANED:", cleanedPhone);
      console.log("MATCH:", lead?.first_name || "NONE");

      return {
        ...event,
        cleaned_phone: cleanedPhone,
        lead,
      };
    })
  );

  return NextResponse.json({
    ok: true,
    events: enriched,
  });
}