// app/dashboard/commissions/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type CommissionRow = {
  id: string;
  lead_id: string;
  partner_id: string | null;
  commission_status: string | null;
  created_at: string | null;
  swing_price?: number | null;
  accessory_price?: number | null;
  payout_method?: string | null;
  payout_date?: string | null;
  admin_notes?: string | null;
  order_status?: string | null;
};

type TimeRange = "all" | "week" | "month" | "year";

/* ===============================
   PAGE
================================ */
export default function CommissionDashboardPage() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadCommissions();
  }, []);

  async function loadCommissions() {
    setLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Failed to load commissions.");
      setCommissions([]);
    } else {
      setCommissions((data || []) as CommissionRow[]);
    }

    setLoading(false);
  }

  function getRangeStart(range: TimeRange): Date | null {
    const now = new Date();
    if (range === "all") return null;
    const d = new Date(now);
    if (range === "week") d.setDate(d.getDate() - 7);
    if (range === "month") d.setMonth(d.getMonth() - 1);
    if (range === "year") d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  const filteredCommissions = useMemo(() => {
    const startDate = getRangeStart(timeRange);
    return commissions.filter((row) => {
      if (startDate && row.created_at) {
        if (new Date(row.created_at) < startDate) return false;
      }
      if (statusFilter !== "all" && row.commission_status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const hay = `${row.lead_id} ${row.partner_id ?? ""} ${
          row.admin_notes ?? ""
        }`.toLowerCase();
        if (!hay.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });
  }, [commissions, timeRange, statusFilter, searchTerm]);

  function getCommission(row: CommissionRow) {
    const base =
      Number(row.swing_price || 0) + Number(row.accessory_price || 0);
    return Math.round(base * 0.12 * 100) / 100;
  }

  async function updateCommissionStatus(
    row: CommissionRow,
    status: "pending" | "approved" | "paid" | "voided"
  ) {
    const { error } = await supabase
      .from("leads")
      .update({ commission_status: status })
      .eq("id", row.id);

    if (error) {
      alert(error.message);
      return;
    }

    setCommissions((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, commission_status: status } : r
      )
    );
  }

  function fmtMoney(v: number) {
    return "$" + v.toFixed(2);
  }

  function fmtDate(v: string | null) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString();
  }

  if (loading) return <div className="p-6">Loading commissions…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <h1 className="text-3xl font-bold text-red-700">
          Commission Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Track all partner commissions, payouts, and earnings.
        </p>

        <div className="flex gap-2 mt-3 flex-wrap">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </select>

          <input
            className="border rounded px-3 py-2 text-sm w-full md:max-w-sm"
            placeholder="Search partner, order, notes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      {/* RECORDS */}
      <div className="space-y-3">
        {filteredCommissions.map((row) => (
          <div
            key={row.id}
            className="bg-white border rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <strong>Order: {row.lead_id}</strong>
              <strong>{fmtMoney(getCommission(row))}</strong>
            </div>

            <div className="text-sm">
              Order Status:{" "}
              <span className="font-semibold">
                {row.order_status || "not set"}
              </span>
            </div>

            <div className="text-sm">
              Commission Status:{" "}
              <span className="font-semibold">
                {row.commission_status || "pending"}
              </span>{" "}
              | Created: {fmtDate(row.created_at)}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Update Commission Status
              </label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={row.commission_status || "pending"}
                onChange={(e) =>
                  updateCommissionStatus(
                    row,
                    e.target.value as
                      | "pending"
                      | "approved"
                      | "paid"
                      | "voided"
                  )
                }
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="voided">Voided</option>
              </select>
            </div>

            <div className="text-xs text-gray-600">
              Payout:{" "}
              {row.payout_method
                ? `${row.payout_method} on ${fmtDate(
                    row.payout_date || null
                  )}`
                : "Not paid yet"}
            </div>

            {row.admin_notes && (
              <div className="text-xs text-gray-700">
                Notes: {row.admin_notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
