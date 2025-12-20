"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type Order = {
  id: string;
  order_id: string;
  partner_id: string;
  customer_name?: string;
  customer_email?: string;
  swing_price?: number;
  accessory_price?: number;
  installation_fee?: number;
  shipping_fee?: number;
  total_commission?: number;
  order_status?: string;
  created_at: string;
};

/* ===============================
   PAGE
================================ */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  /* ===============================
     LOAD ORDERS
  ================================ */
  async function loadOrders() {
    setLoading(true);

    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* ===============================
     FILTER
  ================================ */
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    const q = search.toLowerCase();
    return orders.filter((o) =>
      `${o.order_id} ${o.partner_id} ${o.customer_name} ${o.customer_email}`
        .toLowerCase()
        .includes(q)
    );
  }, [orders, search]);

  /* ===============================
     SAVE EDIT
  ================================ */
  async function saveEdit() {
    if (!editOrder) return;

    await supabase
      .from("orders")
      .update({
        swing_price: editOrder.swing_price,
        accessory_price: editOrder.accessory_price,
        installation_fee: editOrder.installation_fee,
        shipping_fee: editOrder.shipping_fee,
        order_status: editOrder.order_status,
      })
      .eq("id", editOrder.id);

    setEditOrder(null);
    loadOrders();
  }

  /* ===============================
     DELETE
  ================================ */
  async function deleteOrder(order: Order) {
    if (!confirm(`Delete order ${order.order_id}?`)) return;

    await supabase.from("orders").delete().eq("id", order.id);
    loadOrders();
  }

  if (loading) return <div className="p-6">Loading orders…</div>;

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-6 pb-6 space-y-4">
      {/* ==========================
            STICKY HEADER
      =========================== */}
      <div className="sticky top-0 z-30 bg-white pb-4 border-b shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Orders</h1>
          <span className="text-sm text-gray-600">
            Total: {filteredOrders.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Doorplace USA — Order Management
        </p>

        <input
          className="border rounded px-3 py-2 w-full md:max-w-sm"
          placeholder="Search Order ID, Partner ID, Customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ==========================
            TABLE
      =========================== */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-3 py-3 text-left w-[20%]">Order ID</th>
              <th className="px-3 py-3 text-left w-[20%]">Partner ID</th>
              <th className="px-3 py-3 text-left w-[20%]">Customer</th>
              <th className="px-3 py-3 text-left w-[15%]">Status</th>
              <th className="px-3 py-3 text-left w-[15%]">Commission</th>
              <th className="px-3 py-3 text-left w-[10%]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-3 font-mono text-xs truncate">
                  {o.order_id}
                </td>

                <td className="px-3 py-3 font-mono text-xs truncate">
                  {o.partner_id}
                </td>

                <td className="px-3 py-3 truncate">
                  {o.customer_name || "—"}
                </td>

                <td className="px-3 py-3">
                  <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                    {o.order_status || "new"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  ${o.total_commission?.toFixed(2) || "0.00"}
                </td>

                <td className="px-3 py-3">
                  <select
                    className="border rounded px-2 py-1 text-xs w-full"
                    onChange={(e) => {
                      const v = e.target.value;
                      e.target.value = "";
                      if (v === "view") setViewOrder(o);
                      if (v === "edit") setEditOrder(o);
                      if (v === "delete") deleteOrder(o);
                    }}
                  >
                    <option value="">Select</option>
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==========================
            VIEW MODAL
      =========================== */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full">
            <h2 className="text-xl font-bold mb-3">Order Details</h2>

            <p><b>Order ID:</b> {viewOrder.order_id}</p>
            <p><b>Partner ID:</b> {viewOrder.partner_id}</p>
            <p><b>Customer:</b> {viewOrder.customer_name}</p>
            <p><b>Email:</b> {viewOrder.customer_email}</p>

            <p className="mt-2"><b>Swing:</b> ${viewOrder.swing_price}</p>
            <p><b>Accessories:</b> ${viewOrder.accessory_price}</p>
            <p><b>Install:</b> ${viewOrder.installation_fee}</p>
            <p><b>Shipping:</b> ${viewOrder.shipping_fee}</p>
            <p><b>Commission:</b> ${viewOrder.total_commission}</p>
            <p><b>Status:</b> {viewOrder.order_status}</p>

            <button
              className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              onClick={() => setViewOrder(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ==========================
            EDIT MODAL
      =========================== */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full">
            <h2 className="text-xl font-bold mb-3">Edit Order</h2>

            {[
              "swing_price",
              "accessory_price",
              "installation_fee",
              "shipping_fee",
              "order_status",
            ].map((f) => (
              <input
                key={f}
                className="border w-full mb-2 px-3 py-2"
                placeholder={f.replace("_", " ")}
                value={(editOrder as any)[f] || ""}
                onChange={(e) =>
                  setEditOrder({ ...editOrder, [f]: e.target.value })
                }
              />
            ))}

            <div className="flex gap-2 mt-3">
              <button
                className="bg-red-700 text-white px-4 py-2 rounded flex-1"
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded flex-1"
                onClick={() => setEditOrder(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

