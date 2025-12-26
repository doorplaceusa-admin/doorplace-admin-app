"use client";

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
  partner_name?: string;

  customer_first_name?: string;
  customer_last_name?: string;

  swing_price?: number | string;
  accessory_price?: number | string;

  order_status?: string;
};

/* ===============================
   HELPERS
================================ */
function toNum(v: any) {
  if (v === null || v === undefined || v === "") return 0;
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
export default function CommissionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<"orders" | "leads">("orders");

  /* ===============================
     LOAD DATA (ADMIN — ALL ROWS)
  ================================ */
  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD COMMISSIONS ERROR:", error);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ===============================
     FILTERED SETS
  ================================ */
  const orders = useMemo(
    () => rows.filter((r) => r.submission_type === "partner_order"),
    [rows]
  );

  const leads = useMemo(
    () => rows.filter((r) => r.submission_type !== "partner_order"),
    [rows]
  );

  /* ===============================
     COMMISSION CALC
  ================================ */
  function calc(row: Row) {
    const base =
      toNum(row.swing_price) + toNum(row.accessory_price);

    const commission = Math.round(base * 0.12 * 100) / 100;
    const residual = Math.round(base * 0.05 * 100) / 100; // display only

    return { base, commission, residual };
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Commissions</h1>

      {/* TABS */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "orders"
              ? "bg-red-700 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>

        <button
          className={`px-4 py-2 rounded ${
            activeTab === "leads"
              ? "bg-red-700 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("leads")}
        >
          Leads
        </button>
      </div>

      {/* ORDERS */}
      {activeTab === "orders" && (
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Orders</h2>

          {orders.length === 0 && (
            <div className="text-sm text-gray-500">
              No orders found.
            </div>
          )}

          {orders.map((o) => {
            const c = calc(o);
            return (
              <div
                key={o.id}
                className="border-b py-2 text-sm"
              >
                <div>
                  <b>Order:</b> {o.lead_id}
                </div>
                <div>
                  <b>Partner:</b>{" "}
                  {o.partner_name || "—"}{" "}
                  {o.partner_id ? `(${o.partner_id})` : ""}
                </div>
                <div>
                  <b>Customer:</b>{" "}
                  {o.customer_first_name}{" "}
                  {o.customer_last_name}
                </div>
                <div>
                  <b>Commission:</b> {money(c.commission)}
                </div>
                <div className="text-xs text-gray-500">
                  Residual (5% – if repeat): {money(c.residual)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEADS */}
      {activeTab === "leads" && (
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Leads</h2>

          {leads.length === 0 && (
            <div className="text-sm text-gray-500">
              No leads found.
            </div>
          )}

          {leads.map((l) => (
            <div
              key={l.id}
              className="border-b py-2 text-sm"
            >
              <div>
                <b>Lead:</b> {l.lead_id}
              </div>
              <div>
                <b>Partner:</b>{" "}
                {l.partner_name || "—"}{" "}
                {l.partner_id ? `(${l.partner_id})` : ""}
              </div>
              <div>
                <b>Customer:</b>{" "}
                {l.customer_first_name}{" "}
                {l.customer_last_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
