import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 🔹 Normalize phone
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

// 🔹 Track last logged call (prevents spam)
let lastLoggedCallId: string | null = null;

export async function GET() {
  const { data: events, error } = await supabaseAdmin
    .from("iplum_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  // 🔥 STEP 1: collect unique cleaned phones
  const phones = [
    ...new Set(
      (events || [])
        .map((e) => cleanPhone(e.from_number || e.to_number))
        .filter(Boolean)
    ),
  ];

  // 🔥 STEP 2: fetch matches in bulk
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("*")
    .in("phone_clean", phones);

  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .in("phone_clean", phones);

  // 🔥 STEP 3: maps for fast lookup
  const leadMap = new Map<string, any>();
  const invoiceMap = new Map<string, any>();

  (leads || []).forEach((l) => {
    if (l.phone_clean) leadMap.set(l.phone_clean, l);
  });

  (invoices || []).forEach((i) => {
    if (i.phone_clean) invoiceMap.set(i.phone_clean, i);
  });

  // 🔥 STEP 4: enrich events
  const enriched = (events || []).map((event) => {
    const rawPhone = event.from_number || event.to_number || null;
    const cleanedPhone = cleanPhone(rawPhone);

    let lead = null;
    let invoice = null;
    let matchType: "lead" | "invoice" | "unknown" = "unknown";

    if (cleanedPhone) {
      if (leadMap.has(cleanedPhone)) {
        lead = leadMap.get(cleanedPhone);
        matchType = "lead";
      } else if (invoiceMap.has(cleanedPhone)) {
        invoice = invoiceMap.get(cleanedPhone);
        matchType = "invoice";
      }
    }

    // 🔥 CLEAN LOGGING (ONLY NEW CALLS)
    if (event.id !== lastLoggedCallId) {
      lastLoggedCallId = event.id;

      const name =
        lead?.first_name ||
        invoice?.customer_name ||
        "UNKNOWN";

      console.log("\n📞 NEW CALL EVENT");
      console.log("📱 Phone:", rawPhone);
      console.log("🔢 Cleaned:", cleanedPhone);
      console.log("📊 Type:", matchType);
      console.log("👤 Name:", name);
    }

    return {
      ...event,
      cleaned_phone: cleanedPhone,
      lead,
      invoice,
      match_type: matchType,
    };
  });

  return NextResponse.json({
    ok: true,
    events: enriched,
  });
}