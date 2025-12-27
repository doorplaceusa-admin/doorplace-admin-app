"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type Row = {
  id: string;
  lead_id: string;
  submission_type: string;
  partner_id?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  swing_price?: number | string;
  accessory_price?: number | string;
  order_status?: string;
  notes?: string;
  created_at?: string;
};

/* ===============================
   HELPERS
================================ */
function toNum(v: any) {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

/* ===============================
   PAGE
================================ */
export default function PartnerOrdersPage() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  /* LOAD PARTNER ID */
  useEffect(() => {
    async function loadPartnerId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return setLoading(false);

      const { data } = await supabase
        .from("partners")
        .select("partner_id")
        .eq("email_address", user.email)
        .single();

      if (!data?.partner_id) return setLoading(false);
      setPartnerId(data.partner_id);
    }

    loadPartnerId();
  }, []);

  /* LOAD ORDERS */
  useEffect(() => {
    if (!partnerId) return;

    async function loadOrders() {
      setLoading(true);

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("partner_id", partnerId)
        .eq("submission_type", "partner_order")
        .order("created_at", { ascending: false });

      setRows(data || []);
      setLoading(false);
    }

    loadOrders();
  }, [partnerId]);

  if (loading) return <div className="p-6">Loading…</div>;

  if (!partnerId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-700">
          Partner Access Pending
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Orders</h1>

      <div className="border rounded divide-y text-sm">
        {rows.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No orders yet.
          </div>
        )}

        {rows.map((o) => {
          const total =
            toNum(o.swing_price) + toNum(o.accessory_price);

          return (
            <div
              key={o.id}
              className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3"
            >
              <div>{o.lead_id}</div>
              <div>{o.customer_first_name} {o.customer_last_name}</div>
              <div>{money(total)}</div>
              <div>{o.order_status || "—"}</div>
              <div className="text-gray-500">{o.notes || "—"}</div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 text-center">
        <a
          href="/partners/dashboard"
          className="inline-block px-4 py-2 border rounded text-sm"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
