"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


type UserRole = "admin" | "partner";
type CommissionRow = {
  id: string;
  company_id: string | null;
  partner_id: string | null;
  order_id: string | null;
  commission_amount: number | null;
  commission_status: string | null;
  created_at: string | null;
  payout_method?: string | null;
  payout_date?: string | null;
  admin_notes?: string | null;
  stripe_payout_id?: string | null;
  payout_locked?: boolean | null;

};
type TimeRange = "all" | "week" | "month" | "year";
export default function CommissionDashboardPage() {
  const [userRole, setUserRole] = useState<UserRole>("partner");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Filters
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null); // drilldown
  // Editing state (admin only)
  const [editing, setEditing] = useState<CommissionRow | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [editPayoutMethod, setEditPayoutMethod] = useState<string>("");
  const [editPayoutDate, setEditPayoutDate] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  useEffect(() => {
    loadUserAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function loadUserAndData() {
    setLoading(true);
    setErrorMessage(null);
    const supabase = createClientHelper();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      setErrorMessage("Unable to load user. Please log in again.");
      setLoading(false);
      return;
    }
    const user = data.user;
    const meta: any = user.user_metadata || {};
    const role: UserRole = meta.role === "admin" ? "admin" : "partner";
    setUserRole(role);
    setCompanyId(meta.company_id || null);
    setPartnerId(meta.partner_id || null);
    await loadCommissions(role, meta.company_id, meta.partner_id);
    setLoading(false);
  }
  async function loadCommissions(role: UserRole, cId?: string, pId?: string) {
    setErrorMessage(null);
    const supabase = createClientHelper();
    let query = supabase.from("commissions").select("*").order("created_at", {
      ascending: false,
    });
    if (role === "admin" && cId) {
      query = query.eq("company_id", cId);
    } else if (role === "partner" && pId) {
      query = query.eq("partner_id", pId);
    }
    const { data, error } = await query;
    if (error) {
      console.error(error);
      setErrorMessage("Failed to load commissions.");
      setCommissions([]);
      return;
    }
    setCommissions((data || []) as CommissionRow[]);
  }
  // Helper to compute start date for filters
  function getRangeStart(range: TimeRange): Date | null {
    const now = new Date();
    if (range === "all") return null;
    const d = new Date(now);
    if (range === "week") {
      d.setDate(d.getDate() - 7);
    } else if (range === "month") {
      d.setMonth(d.getMonth() - 1);
    } else if (range === "year") {
      d.setFullYear(d.getFullYear() - 1);
    }
    return d;
  }
  // Apply filters in-memory
  const filteredCommissions = useMemo(() => {
    const startDate = getRangeStart(timeRange);
    return commissions.filter((row) => {
      if (!row) return false;
      // Time range filter
      if (startDate && row.created_at) {
        const created = new Date(row.created_at);
        if (created < startDate) return false;
      }
      // Status filter
      if (statusFilter !== "all" && row.commission_status !== statusFilter) {
        return false;
      }
      // Selected partner drilldown (admin)
      if (selectedPartner && row.partner_id !== selectedPartner) {
        return false;
      }
      // Search filter (partner_id, order_id, notes, payout_method)
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const haystack =
          (row.partner_id || "") +
          " " +
          (row.order_id || "") +
          " " +
          (row.admin_notes || "") +
          " " +
          (row.payout_method || "");
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [commissions, timeRange, statusFilter, searchTerm, selectedPartner]);
  // Company-level summary by partner (admin only)
  const partnerSummary = useMemo(() => {
    if (userRole !== "admin") return [];
    const map: Record<
      string,
      {
        partner_id: string;
        total_orders: number;
        total_commissions: number;
        pending_commissions: number;
        paid_commissions: number;
      }
    > = {};
    filteredCommissions.forEach((row) => {
      const pid = row.partner_id || "Unknown";
      if (!map[pid]) {
        map[pid] = {
          partner_id: pid,
          total_orders: 0,
          total_commissions: 0,
          pending_commissions: 0,
          paid_commissions: 0,
        };
      }
      const amount = Number(row.commission_amount || 0);
      map[pid].total_orders += 1;
      map[pid].total_commissions += amount;
      if (row.commission_status === "paid") {
        map[pid].paid_commissions += amount;
      } else if (row.commission_status === "pending") {
        map[pid].pending_commissions += amount;
      }
    });
    return Object.values(map);
  }, [filteredCommissions, userRole]);

  // ✅ LIFETIME STATS (FIX FOR RUNTIME ERROR)
const lifetimeStats = useMemo(() => {
  const totalOrders = commissions.length;
  let totalEarned = 0;
  let pending = 0;
  let paid = 0;

  commissions.forEach((row) => {
    const amt = Number(row.commission_amount || 0);
    totalEarned += amt;
    if (row.commission_status === "pending") pending += amt;
    if (row.commission_status === "paid") paid += amt;
  });

  return {
    totalOrders,
    totalEarned,
    pending,
    paid,
  };
}, [commissions]); 

  // Top stat cards
  const topStats = useMemo(() => {
    const totalOrders = filteredCommissions.length;
    let totalEarned = 0;
    let pending = 0;
    let paid = 0;
    filteredCommissions.forEach((row) => {
      const amt = Number(row.commission_amount || 0);
      totalEarned += amt;
      if (row.commission_status === "pending") pending += amt;
      if (row.commission_status === "paid") paid += amt;
    });
    const avgPerOrder = totalOrders > 0 ? totalEarned / totalOrders : 0;
    return {
      totalOrders,
      totalEarned,
      pending,
      paid,
      avgPerOrder,
    };
  }, [filteredCommissions]);

 

  // EDIT HANDLERS (admin only)
  function openEdit(row: CommissionRow) {
    setEditing(row);
    setEditAmount(row.commission_amount?.toString() || "");
    setEditStatus(row.commission_status || "pending");
    setEditPayoutMethod(row.payout_method || "");
    setEditPayoutDate(
      row.payout_date ? row.payout_date.slice(0, 10) : "" // yyyy-mm-dd
    );
    setEditNotes(row.admin_notes || "");
  }
  async function saveEdit() {
    if (!editing) return;
    const parsedAmount = parseFloat(editAmount || "0");
    if (isNaN(parsedAmount)) {
      alert("Commission amount must be a number.");
      return;
    }
    const updates: Partial<CommissionRow> = {
      commission_amount: parsedAmount,
      commission_status: editStatus,
      payout_method: editPayoutMethod || null,
      payout_date: editPayoutDate || null,
      admin_notes: editNotes || null,
    };
    const supabase = createClientHelper();
    const { error } = await supabase
      .from("commissions")
      .update(updates)
      .eq("id", editing.id);
    if (error) {
      console.error(error);
      alert("Failed to update commission: " + error.message);
      return;
    }
    // Update local state
    setCommissions((prev) =>
      prev.map((row) =>
        row.id === editing.id ? { ...row, ...updates } as CommissionRow : row
      )
    );
    setEditing(null);
  }
  async function markAsPaid(row: CommissionRow) {
    const supabase = createClientHelper();
  const { error } = await supabase
    .from("commissions")
    .update({
      commission_status: "paid",
      payout_date: new Date().toISOString(),
      payout_locked: true,
    })
    .eq("id", row.id);

  if (error) {
    console.error(error);
    alert("Failed to mark as paid: " + error.message);
    return;
  }

  setCommissions((prev) =>
    prev.map((r) =>
      r.id === row.id
        ? {
            ...r,
            commission_status: "paid",
            payout_date: new Date().toISOString(),
            payout_locked: true,
          }
        : r
    )
  );
}

  // Helper formatting
  function fmtMoney(value: number) {
    return "$" + value.toFixed(2);
  }
  function fmtDate(value: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  }

function exportCommissionsToCSV() {
  if (!commissions || commissions.length === 0) {
    alert("No commission data to export.");
    return;
  }

  const headers = Object.keys(commissions[0]) as (keyof typeof commissions[0])[];

  const csvRows = [
    headers.join(","), // header row
    ...commissions.map(row =>
      headers
        .map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "commissions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}




 async function runSimulatedPayouts() {
  const res = await fetch("/api/stripe/simulate-payout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const data = await res.json();
  alert(JSON.stringify(data, null, 2));

  // ✅ Reload commissions after payout simulation
  loadUserAndData();
}


{userRole === "admin" && (
  <div style={{ marginBottom: "20px" }}>
    <button
      onClick={exportCommissionsToCSV}
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#444",
        color: "white",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Export Commissions to CSV
    </button>
  </div>
)}


async function markCommissionPaid(commissionId: string) {
  const res = await fetch("/api/stripe/mark-paid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commission_id: commissionId }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  alert("Commission marked as PAID ✅");
  loadUserAndData(); // refresh dashboard
}


  // ===================== RENDER =====================
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h2>Commission Dashboard</h2>
      <p style={{ marginBottom: "20px" }}>
        Track all partner commissions, payouts, and earnings over time.
      </p>

{/* ✅ LIFETIME TOTALS */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  }}
>
  <StatCard
    title="Lifetime Orders"
    value={lifetimeStats.totalOrders.toString()}
  />
  <StatCard
    title="Lifetime Earned"
    value={fmtMoney(lifetimeStats.totalEarned)}
  />
  <StatCard
    title="Lifetime Pending"
    value={fmtMoney(lifetimeStats.pending)}
  />
  <StatCard
    title="Lifetime Paid"
    value={fmtMoney(lifetimeStats.paid)}
  />
</div>


      {/* Top Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard title="Total Orders" value={topStats.totalOrders.toString()} />
        <StatCard
          title="Total Earned"
          value={fmtMoney(topStats.totalEarned)}
        />
        <StatCard title="Pending" value={fmtMoney(topStats.pending)} />
        <StatCard title="Paid" value={fmtMoney(topStats.paid)} />
      </div>
      {/* Filters Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          alignItems: "center",
        }}
      >
        {/* Time range */}
        <div>
          <label style={labelStyle}>Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            style={selectStyle}
          >
            <option value="week">This Week (7 days)</option>
            <option value="month">This Month (30 days)</option>
            <option value="year">This Year (12 months)</option>
            <option value="all">All Time</option>
          </select>
        </div>
        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </select>
        </div>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "220px" }}>
          <label style={labelStyle}>Search</label>
          <input
            style={inputStyle}
            placeholder="Search partner, order, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Partner Drilldown Reset */}
        {userRole === "admin" && selectedPartner && (
          <button
            onClick={() => setSelectedPartner(null)}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
              marginTop: "18px",
              height: "40px",
            }}
          >
            Clear Partner Filter
          </button>
        )}
      </div>
      {loading && <p>Loading commissions…</p>}
      {errorMessage && (
        <p style={{ color: "red", marginBottom: "16px" }}>{errorMessage}</p>
      )}
      {/* ✅ Admin: Partner Summary Controls */}
{userRole === "admin" && (
  <div
    style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "30px",
    }}
  >
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={runSimulatedPayouts}
        style={{
          padding: "10px 16px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#28a745",
          color: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Run Simulated Payouts (Safe Mode)
      </button>
    </div>


          <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
            Partner Commission Summary
          </h3>
          <p style={{ marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
            Click a partner row to drill into that partner’s commission history.
          </p>
          {partnerSummary.length === 0 ? (
            <p style={{ marginTop: "12px" }}>No commissions found.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTd}>Partner ID</th>
                  <th style={thTd}>Total Orders</th>
                  <th style={thTd}>Total Earned</th>
                  <th style={thTd}>Pending</th>
                  <th style={thTd}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {partnerSummary.map((row) => (
                  <tr
                    key={row.partner_id}
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedPartner === row.partner_id ? "#f2f8ff" : "white",
                    }}
                    onClick={() =>
                      setSelectedPartner(
                        selectedPartner === row.partner_id
                          ? null
                          : row.partner_id
                      )
                    }
                  >
                    <td style={thTd}>{row.partner_id}</td>
                    <td style={thTd}>{row.total_orders}</td>
                    <td style={thTd}>{fmtMoney(row.total_commissions)}</td>
                    <td style={thTd}>{fmtMoney(row.pending_commissions)}</td>
                    <td style={thTd}>{fmtMoney(row.paid_commissions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* Detailed Commission List */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "40px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Commission Records</h3>
        {filteredCommissions.length === 0 ? (
          <p style={{ marginTop: "12px" }}>No commission records yet.</p>
        ) : (
          <div style={{ marginTop: "12px" }}>
            {filteredCommissions.map((row) => (
              <div
                key={row.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                  background: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  <span>
                    Order:{" "}
                    {row.order_id ? row.order_id : "—"}{" "}
                    {userRole === "admin" && row.partner_id
                      ? `| Partner: ${row.partner_id}`
                      : ""}
                  </span>
                  <span>{fmtMoney(Number(row.commission_amount || 0))}</span>
                </div>
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                  Status:{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {row.commission_status || "not set"}
                  </strong>{" "}
                  | Created: {fmtDate(row.created_at)}
                </div>
                <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                  Payout:{" "}
                  {row.payout_method
                    ? `${row.payout_method} on ${fmtDate(row.payout_date || null)}`
                    : "Not paid yet"}
                </div>
                {row.admin_notes && (
                  <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                    Notes: {row.admin_notes}
                  </div>
                )}
                {userRole === "admin" && (
                  <div style={{ marginTop: "8px" }}>
                    <button
                      onClick={() => openEdit(row)}
                      style={buttonPrimary}
                    >
                      Edit
                    </button>
                    {row.commission_status !== "paid" && (
                      <button
                        onClick={() => markAsPaid(row)}
                        style={buttonSecondary}
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* EDIT PANEL */}
      {userRole === "admin" && editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              width: "420px",
              maxWidth: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
              Edit Commission
            </h3>
            <p style={{ fontSize: "13px", marginTop: 0, marginBottom: "14px" }}>
              Partner: {editing.partner_id || "Unknown"} | Order:{" "}
              {editing.order_id || "—"}
            </p>
            <label style={labelStyle}>Amount</label>
            <input
              style={inputStyle}
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
            <label style={labelStyle}>Status</label>
            <select
              style={selectStyle}
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="voided">Voided</option>
            </select>
            <label style={labelStyle}>Payout Method</label>
            <input
              style={inputStyle}
              placeholder="Stripe, ACH, Zelle, etc."
              value={editPayoutMethod}
              onChange={(e) => setEditPayoutMethod(e.target.value)}
            />
            <label style={labelStyle}>Payout Date</label>
            <input
              type="date"
              style={inputStyle}
              value={editPayoutDate}
              onChange={(e) => setEditPayoutDate(e.target.value)}
            />
            <label style={labelStyle}>Admin Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: "70px" }}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              <button
                onClick={() => setEditing(null)}
                style={buttonSecondary}
              >
                Cancel
              </button>
              <button onClick={saveEdit} style={buttonPrimary}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ===== Reusable UI bits (match Leads / Companies feel) =====
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px 14px",
        background: "white",
      }}
    >
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
        {title}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  marginBottom: 0,
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "4px",
};
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "8px",
};
const thTd: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px 10px",
  fontSize: "13px",
};
const buttonPrimary: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  cursor: "pointer",
  fontSize: "13px",
  marginRight: "6px",
};
const buttonSecondary: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  backgroundColor: "#f5f5f5",
  cursor: "pointer",
  fontSize: "13px",
};






