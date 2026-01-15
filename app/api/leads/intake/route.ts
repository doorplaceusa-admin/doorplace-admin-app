// app/api/leads/intake/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyAdmin } from "@/lib/notifyAdmin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lead_id = `LD-${Date.now()}`;

    /* ===============================
       PARTNER LOOKUP
    ================================ */
    const url = new URL(req.url);
    const partnerId =
      (formData.get("partner_id") as string | null) ||
      url.searchParams.get("partner_id");

    let partnerName: string | null = null;
    let companyId: string | null = null;

    if (partnerId) {
      const { data: partner } = await supabaseAdmin
        .from("partners")
        .select("first_name, last_name, company_id")
        .eq("partner_id", partnerId)
        .single();

      if (partner) {
        partnerName = `${partner.first_name ?? ""} ${partner.last_name ?? ""}`.trim();
        companyId = partner.company_id;
      }
    }

    /* ===============================
       INSERT LEAD
    ================================ */
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert({
        lead_id,
        partner_id: partnerId,
        partner_name: partnerName,
        company_id: companyId ?? "88c22910-7bd1-42fc-bc81-8144a50d7b41",
        lead_status: "new",
        source: "website",
      })
      .select()
      .single();

    if (error || !lead) {
      console.error("Insert failed:", error);
      return new NextResponse("Insert failed", { status: 500 });
    }

    /* ===============================
       ADMIN IN-APP NOTIFICATION (NEW)
    ================================ */
    await notifyAdmin({
      type: "lead_created",
      title: "New Lead / Order Received",
      body: "A new entry was added to the leads table",
      entityType: "lead",
      entityId: lead.id,
      companyId: lead.company_id,
    });

    /* ===============================
       REDIRECT
    ================================ */
    return NextResponse.redirect(
      "https://doorplaceusa.com/pages/thank-you",
      { status: 302 }
    );

  } catch (err) {
    console.error("Lead intake crash:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
