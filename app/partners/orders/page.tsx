"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type Row = {
  id: string;
  lead_id: string;
  submission_type: string;
  partner_id?: string;
  first_name?: string;
  last_name?: string;
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

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("partners")
        .select("partner_id")
        .eq("email_address", user.email)
        .single();

      if (!data?.partner_id) {
        setLoading(false);
        return;
      }

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
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-gray-500">
          View your submitted orders and current status
        </p>
      </div>

      {/* ORDERS */}
      <div className="space-y-4">
        {rows.length === 0 && (
          <div className="border rounded p-6 text-center text-gray-500">
            No orders yet.
          </div>
        )}

        {rows.map((o) => (
          <div
            key={o.id}
            className="border rounded-lg p-4 space-y-3 bg-white"
          >
            {/* ORDER ID */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Order #</span>
              <span className="font-mono">{o.lead_id}</span>
            </div>

            {/* CUSTOMER */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium">
                {o.first_name} {o.last_name}
              </span>
            </div>

            {/* SWING PRICE */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Swing Price</span>
              <span className="font-semibold">
                {money(toNum(o.swing_price))}
              </span>
            </div>

            {/* ACCESSORY PRICE */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Accessory Price</span>
              <span className="font-semibold">
                {money(toNum(o.accessory_price))}
              </span>
            </div>

            {/* ORDER DATE */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Date</span>
              <span className="font-medium">
                {formatDate(o.created_at)}
              </span>
            </div>

            {/* STATUS */}
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {o.order_status
                  ? o.order_status.replace("_", " ")
                  : "—"}
              </span>
            </div>

            {/* NOTES */}
            {o.notes && (
              <div className="pt-2 text-xs text-gray-500">
                <span className="font-medium">Notes:</span> {o.notes}
              </div>
            )}
          </div>
        ))}
      </div>

<a
  href="/partners/orders/new"
  className="block w-full bg-black text-white rounded-xl px-6 py-5 text-center shadow-sm hover:opacity-90 transition"
>
  <div className="text-sm text-gray-300 font-medium">
    Primary Action
  </div>
  <div className="text-xl font-bold">
    Submit Swing Order
  </div>
</a>



      {/* BACK */}
      <div className="pt-4 text-center">
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
function ActionButton({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`block text-center py-3 rounded font-bold ${className}`}
    >
      {label}
    </a>
  );
}