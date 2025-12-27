// app/api/freshbooks/invoices/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: tokenRow } = await supabaseAdmin
      .from("freshbooks_tokens")
      .select("access_token")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!tokenRow?.access_token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const ACCOUNT_ID = process.env.FRESHBOOKS_ACCOUNT_ID;
    if (!ACCOUNT_ID) {
      return NextResponse.json({ error: "No account id" }, { status: 500 });
    }

    const res = await fetch(
      `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices?include[]=lines&include[]=client&include[]=payments&per_page=500`,
      {
        headers: {
          Authorization: `Bearer ${tokenRow.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const json = await res.json();

    const invoices =
      json?.response?.result?.invoices?.map((inv: any) => {
        const client = inv.client || {};

        return {
          invoiceid: inv.id,
          invoice_number: inv.invoice_number,
          status: inv.status,

          issued_at: inv.create_date,
          due_date: inv.due_date,

          customer_name:
            [client.fname, client.lname].filter(Boolean).join(" ") ||
            client.organization ||
            "",

          customer_email: client.email || "",
          customer_phone: inv.client?.phone || "",


          street: client.p_street || "",
          city: client.p_city || "",
          province: client.p_province || "",
          postal_code: client.p_postal_code || "",

          currency_code: inv.amount?.currency || "USD",

          amount: inv.amount?.amount || "0",
          paid_amount: inv.paid?.amount || "0",
          outstanding_amount: inv.outstanding?.amount || "0",

          notes: inv.notes || "",

          lines: (inv.lines || []).map((l: any) => ({
            name: l.name,
            description: l.description,
            qty: Number(l.qty || 1),
            unit_cost: { amount: l.unit_cost?.amount || "0" },
            amount: { amount: l.amount?.amount || "0" },
          })),

          pdf_url: inv.links?.client_view || "",
        };
      }) || [];

    return NextResponse.json({ invoices });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "API error" },
      { status: 500 }
    );
  }
}
