// app/dashboard/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable";

/* ===============================
   TYPES
================================ */
type Order = {
  // Core
  id: string;
  order_id?: string;
  created_at?: string;

  // Partner
  partner_id?: string;
  partner_name?: string;

  // Customer
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_street_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zip_code?: string;

  // Swing
  swing_size?: string;
  wood_type?: string;
  finish?: string;
  hanging_method?: string;

  // Pricing (MATCHES LEADS TABLE EXACTLY)
  swing_price?: number | string;
  accessory_price?: number | string;
  installation_fee?: number | string;
  shipping_fee?: number | string;

  // Status
  order_status?: string;
  lead_status?: string;

  // Extras
  bonus_extra?: number | string;

  // Media
  photos?: string[];
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
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Order | null>(null);
  const [editItem, setEditItem] = useState<Order | null>(null);

  /* ===============================
     LOAD
  ================================ */
  async function loadRows() {
    setLoading(true);

    const { data } = await supabase
  .from("leads")
  .select("*")
  .eq("submission_type", "partner_order")
  .order("created_at", { ascending: false });
  const mapped = (data || []).map((l: any) => ({
  id: l.id,
  order_id: l.lead_id,
  created_at: l.created_at,

  partner_id: l.partner_id,
  partner_name: l.partner_name || null,

  customer_first_name: l.first_name,
  customer_last_name: l.last_name,
  customer_email: l.email,
  customer_phone: l.phone,
  customer_street_address: l.street_address,
  customer_city: l.city,
  customer_state: l.state,
  customer_zip_code: l.zip,

  swing_size: l.swing_size,
  wood_type: l.wood_type,
  finish: l.finish,
  hanging_method: l.hanging_method,

  swing_price: l.swing_price,
  accessory_price: l.accessory_price,
  installation_fee: l.installation_fee,
  shipping_fee: l.shipping_fee,

  photos: l.photos || [],
  order_status: l.order_status || "new",
  bonus_extra: l.bonus_extra || 0,
}));



    setRows(mapped);

    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, []);

  /* ===============================
     FILTER
  ================================ */
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((o) =>
      `${o.order_id} ${o.customer_first_name} ${o.customer_last_name} ${o.partner_id} ${o.partner_name}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

 /* ===============================
   COMMISSION CALC (CLIENT-SIDE)
   - Base commission + residual (display only)
================================ */
function calc(order: Order) {
  const swing = toNum(order.swing_price);
  const accessories = toNum(order.accessory_price);
  const install = toNum(order.installation_fee);
  const delivery = toNum(order.shipping_fee);

  // COMMISSION BASE (ONLY THESE TWO)
  const commissionBase = swing + accessories;

  // PRIMARY COMMISSION (12%)
  const commissionRate = 0.12;
  const commission =
    Math.round(commissionBase * commissionRate * 100) / 100;

  // RESIDUAL (5%) — DISPLAY ONLY
  const residualRate = 0.05;
  const residualCommission =
    Math.round(commissionBase * residualRate * 100) / 100;

  // MANUAL BONUS (optional)
  const bonusExtra = toNum(order.bonus_extra);

  // PAYOUT TOTAL (NO RESIDUAL INCLUDED)
  const payoutTotal =
    Math.round((commission + bonusExtra) * 100) / 100;

  return {
    swing,
    accessories,
    install,
    delivery,

    commissionBase,

    commissionRate,
    commission,

    residualRate,
    residualCommission, // ← DISPLAY ONLY

    bonusExtra,
    payoutTotal,
  };
}




 /* ===============================
   SAVE EDIT (LEADS TABLE)
================================ */
async function saveEdit() {
  if (!editItem) return;

 const payload = {
  // ✅ CUSTOMER — MUST MATCH LEADS TABLE
  first_name: editItem.customer_first_name,
  last_name: editItem.customer_last_name,
  email: editItem.customer_email,
  phone: editItem.customer_phone,
  street_address: editItem.customer_street_address,
  city: editItem.customer_city,
  state: editItem.customer_state,
  zip: editItem.customer_zip_code,

  // swing
  swing_size: editItem.swing_size,
  wood_type: editItem.wood_type,
  finish: editItem.finish,
  hanging_method: editItem.hanging_method,

  // pricing
  swing_price: toNum(editItem.swing_price),
  accessory_price: toNum(editItem.accessory_price),
  installation_fee: toNum(editItem.installation_fee),
  shipping_fee: toNum(editItem.shipping_fee),

  // status
  order_status: editItem.order_status,

  // bonus
  bonus_extra: toNum(editItem.bonus_extra),
};


  const { error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", editItem.id);

  if (error) {
    console.error("SAVE FAILED:", error);
    alert(error.message);
    return;
  }

  setEditItem(null);
  await loadRows();
}




  if (loading) return <div className="p-6">Loading orders…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Orders</h1>
          <span className="text-sm text-gray-600">Total: {filteredRows.length}</span>
        </div>

        <p className="text-sm text-gray-500 mb-3">Order Management</p>

        <div className="flex gap-2 items-center flex-wrap">
          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search order, customer, or partner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE (3 columns) */}
      <AdminTable<Order>
        columns={[
          { key: "order", label: "Order" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
        ]}
        rows={filteredRows}
        rowKey={(o) => o.id}
        renderCell={(o, key) => {
          switch (key) {
            case "order":
              return (
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                  {o.partner_id ? `(${o.partner_id})` : ""}
                  </div>
                </div>
              );

            case "status":
              return (
                <span className="text-xs font-semibold">
                  {o.order_status?.trim() ? o.order_status : "—"}
                </span>
              );

            case "actions":
              return (
                <select
                  className="border rounded px-2 py-1 text-xs w-full max-w-[140px]"
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (v === "view") setViewItem(o);
                    if (v === "edit") setEditItem(o);
                  }}
                >
                  <option value="">Select</option>
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
              );

            default:
              return null;
          }
        }}
      />

{/* ===============================
    VIEW MODAL — ORDER DETAILS
================================ */}
{viewItem && (
  <div
    className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4"
    onClick={() => setViewItem(null)}
  >
    <div
      className="bg-white rounded max-w-3xl w-full max-h-[75vh] flex flex-col shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">
          Order Details — {viewItem.order_id}
        </h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* CUSTOMER */}
        <Section title="Customer">
          <Row
            label="Name"
            value={`${viewItem.customer_first_name || ""} ${viewItem.customer_last_name || ""}`}
          />
          <Row label="Email" value={viewItem.customer_email} />
          <Row label="Phone" value={viewItem.customer_phone} />
          <Row
            label="Address"
            value={`${viewItem.customer_street_address || ""} ${viewItem.customer_city || ""}, ${viewItem.customer_state || ""} ${viewItem.customer_zip_code || ""}`}
          />
        </Section>

        {/* PARTNER (READ ONLY) */}
        <Section title="Partner">
          <Row label="Partner Name" value={viewItem.partner_name} />
          <Row label="Partner ID" value={viewItem.partner_id} />
        </Section>

        {/* ORDER STATUS */}
        <Section title="Order Status">
          <Row label="Status" value={viewItem.order_status} />
        </Section>

        {/* SWING DETAILS */}
        <Section title="Swing Details">
          <Row label="Swing Size" value={viewItem.swing_size} />
          <Row label="Wood Type" value={viewItem.wood_type} />
          <Row label="Finish / Stain" value={(viewItem as any).finish ?? (viewItem as any).finish ?? ""} />
          <Row label="Hanging Method" value={viewItem.hanging_method} />
        </Section>

        {/* PRICING + COMMISSION */}
        {(() => {
          // ✅ HARD FALLBACKS (fixes admin-mapped alias fields)
          const swing = toNum(viewItem.swing_price);
          const accessories = toNum((viewItem as any).accessory_price ?? (viewItem as any).accessory_total);
          const install = toNum(viewItem.installation_fee);
          const delivery = toNum((viewItem as any).shipping_fee ?? (viewItem as any).delivery_fee);
          const bonusExtra = toNum(viewItem.bonus_extra);

          const commissionBase = swing + accessories;
          const commissionRate = 0.12;
          const commission = Math.round(commissionBase * commissionRate * 100) / 100;

          const residualRate = 0.05;
          const residualCommission = Math.round(commissionBase * residualRate * 100) / 100;

          const payoutTotal = Math.round((commission + bonusExtra) * 100) / 100;

          return (
            <Section title="Pricing & Commission">
              <Row label="Swing Price" value={money(swing)} />
              <Row label="Accessory Total" value={money(accessories)} />
              <Row label="Installation Fee" value={money(install)} />
              <Row label="Delivery Fee" value={money(delivery)} />

              <div className="mt-2" />

              <Row label="Commission Base" value={money(commissionBase)} />
              <Row label="Commission Rate" value={`${Math.round(commissionRate * 100)}%`} />
              <Row label="Commission" value={money(commission)} />

              <Row
                label="Residual (5% – if repeat customer)"
                value={money(residualCommission)}
                muted
              />

              <Row
                label="Manual Bonus"
                value={bonusExtra ? money(bonusExtra) : "—"}
              />

              <Row label="Total Payout" value={money(payoutTotal)} />
            </Section>
          );
        })()}

        {/* PHOTOS */}
        <Section title="Photos">
          <div className="flex gap-2 flex-wrap">
            {viewItem.photos?.length ? (
              viewItem.photos.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  className="w-28 h-28 object-cover border rounded"
                  alt={`order-photo-${i}`}
                />
              ))
            ) : (
              <span className="text-gray-500 text-sm">No photos uploaded</span>
            )}
          </div>
        </Section>
      </div>

      {/* FIXED FOOTER */}
      <div className="p-4 border-t bg-white">
        <button
          className="bg-black text-white px-4 py-2 rounded w-full"
          onClick={() => setViewItem(null)}
        >
          Close


        </button>
      </div>
    </div>
  </div>
)}


      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-6 rounded max-w-3xl w-full max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">
        Edit Order — {editItem.order_id}
      </h2>

      {/* PARTNER (READ ONLY) */}
      <div className="bg-gray-50 border rounded p-3 text-sm mb-4">
        <div className="font-semibold mb-1">Partner (Read Only)</div>
        <div>Partner Name: {editItem.partner_name || "—"}</div>
        <div>Partner ID: {editItem.partner_id || "—"}</div>
      </div>

      {/* LIVE COMMISSION PREVIEW */}
      {(() => {
        const swing = toNum(editItem.swing_price);
        const accessories = toNum(editItem.accessory_price);
        const bonusExtra = toNum(editItem.bonus_extra);
        const commissionBase = swing + accessories;
        const commission = Math.round(commissionBase * 0.12 * 100) / 100;
        const payoutTotal = Math.round((commission + bonusExtra) * 100) / 100;

        return (
          <div className="bg-white border rounded p-3 text-sm mb-4">
            <div className="font-semibold mb-1">Live Commission Preview</div>
            <div>Commission Base: {money(commissionBase)}</div>
            <div>Commission (12%): {money(commission)}</div>
            <div>Manual Bonus: {bonusExtra ? money(bonusExtra) : "—"}</div>
            <div className="font-semibold">
              Total Payout: {money(payoutTotal)}
            </div>
          </div>
        );
      })()}

      {/* CUSTOMER */}
      <Section title="Customer (Editable)">
        <Grid2>
          <Field
            label="First Name"
            value={editItem.customer_first_name || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_first_name: v })
            }
          />
          <Field
            label="Last Name"
            value={editItem.customer_last_name || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_last_name: v })
            }
          />
          <Field
            label="Email"
            value={editItem.customer_email || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_email: v })
            }
          />
          <Field
            label="Phone"
            value={editItem.customer_phone || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_phone: v })
            }
          />
          <Field
            label="Street Address"
            value={editItem.customer_street_address || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_street_address: v })
            }
            full
          />
          <Field
            label="City"
            value={editItem.customer_city || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_city: v })
            }
          />
          <Field
            label="State"
            value={editItem.customer_state || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_state: v })
            }
          />
          <Field
            label="Zip Code"
            value={editItem.customer_zip_code || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, customer_zip_code: v })
            }
          />
        </Grid2>
      </Section>

      {/* SWING */}
      <Section title="Swing Details (Editable)">
        <Grid2>
          <Field
            label="Swing Size"
            value={editItem.swing_size || ""}
            onChange={(v) => setEditItem({ ...editItem, swing_size: v })}
          />
          <Field
            label="Wood Type"
            value={editItem.wood_type || ""}
            onChange={(v) => setEditItem({ ...editItem, wood_type: v })}
          />
          <Field
            label="Finish / Stain"
            value={editItem.finish || ""}
            onChange={(v) => setEditItem({ ...editItem, finish: v })}
          />
          <Field
            label="Hanging Method"
            value={editItem.hanging_method || ""}
            onChange={(v) =>
              setEditItem({ ...editItem, hanging_method: v })
            }
          />
        </Grid2>
      </Section>

      {/* PRICING */}
      <Section title="Pricing (Editable)">
        <Grid2>
          <NumberField
            label="Swing Price"
            value={editItem.swing_price ?? ""}
            onChange={(v) => setEditItem({ ...editItem, swing_price: v })}
          />
          <NumberField
            label="Accessory Total"
            value={editItem.accessory_price ?? ""}
            onChange={(v) =>
              setEditItem({ ...editItem, accessory_price: v })
            }
          />
          <NumberField
            label="Installation Fee"
            value={editItem.installation_fee ?? ""}
            onChange={(v) =>
              setEditItem({ ...editItem, installation_fee: v })
            }
          />
          <NumberField
            label="Delivery Fee"
            value={editItem.shipping_fee ?? ""}
            onChange={(v) =>
              setEditItem({ ...editItem, shipping_fee: v })
            }
          />
        </Grid2>
      </Section>

      {/* STATUS + BONUS */}
      <Section title="Status & Extras (Editable)">
        <Grid2>
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              Order Status
            </div>
            <select
              className="border w-full px-3 py-2 rounded"
              value={editItem.order_status || "new"}
              onChange={(e) =>
                setEditItem({ ...editItem, order_status: e.target.value })
              }
            >
              {[
                "new",
                "deposit_pending",
                "deposit_received",
                "order_confirmed",
                "in_progress",
                "scheduled",
                "completed",
                "cancelled",
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <NumberField
            label="Bonus / Residual (Manual)"
            value={editItem.bonus_extra ?? ""}
            onChange={(v) =>
              setEditItem({ ...editItem, bonus_extra: v })
            }
            full
          />
        </Grid2>
      </Section>

      <div className="flex gap-2 mt-6">
        <button
          className="bg-red-700 text-white px-4 py-2 rounded flex-1"
          onClick={saveEdit}
        >
          Save
        </button>
        <button
          className="bg-gray-300 px-4 py-2 rounded flex-1"
          onClick={() => setEditItem(null)}
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

/* ===============================
   UI HELPERS
================================ */
function Section({ title, children }: any) {
  return (
    <div className="mt-4">
      <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: any) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <p>
      <b>{label}:</b> {value}
    </p>
  );
}

function Grid2({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <input
        className="border w-full px-3 py-2 rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <input
        type="number"
        inputMode="decimal"
        className="border w-full px-3 py-2 rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
