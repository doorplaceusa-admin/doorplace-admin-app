// app/dashboard/partners/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable";

/* ===============================
   TYPES (PARTNER DATA ONLY)
================================ */


type Partner = {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  cell_phone_number: string;
  partner_id: string;
  tracking_link: string;

  status: "pending" | "active";
  email_verified: boolean;
  welcome_email_sent: boolean;

  business_name?: string;
  coverage_area?: string;
  preferred_contact_method?: string;
  sales_experience?: string;

  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
};



type BulkRepairResponse = {
  success: boolean;
  repaired?: number;
  emailsSent?: number;
  alreadyClean?: number;
  skipped?: number;
  logs?: string[];
};

/* ===============================
   PAGE
================================ */
export default function PartnersPage() {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  const [viewItem, setViewItem] = useState<Partner | null>(null);
  const [editItem, setEditItem] = useState<Partner | null>(null);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);


  /* ===== BULK REPAIR ===== */
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairDryRun, setRepairDryRun] = useState(false);
  const [repairResult, setRepairResult] = useState<BulkRepairResponse | null>(null);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);

  async function loadRows() {
    setLoading(true);

    const { data } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: sort === "oldest" });

    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        `${p.first_name} ${p.last_name} ${p.email_address} ${p.partner_id}`
          .toLowerCase()
          .includes(q)
      );
    }

    if (sort === "name") {
      list.sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      );
    }

    return list;
  }, [rows, search, sort]);

  async function runAction(
    action: "regenerate_partner_id" | "send_welcome_email"|"delete_partner",
    partner: Partner
  ) {
    if (!confirm(`Run ${action.replaceAll("_", " ")} for ${partner.email_address}?`)) return;

    await fetch("/api/partners/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        id: partner.id, 
        partner_id: partner.partner_id,
        email_address: partner.email_address,
      }),
    });

    loadRows();
  }

  async function saveEdit() {
    if (!editItem) return;

    await supabase
      .from("partners")
  .update({
    first_name: editItem.first_name,
    last_name: editItem.last_name,
    email_address: editItem.email_address,
    cell_phone_number: editItem.cell_phone_number,

    business_name: editItem.business_name,
    coverage_area: editItem.coverage_area,
    preferred_contact_method: editItem.preferred_contact_method,
    sales_experience: editItem.sales_experience,

    street_address: editItem.street_address,
    city: editItem.city,
    state: editItem.state,
    zip_code: editItem.zip_code,
  })
  .eq("id", editItem.id);


    setEditItem(null);
    loadRows();
  }

async function updatePartnerStatus(
  partnerId: string,
  status: "active" | "pending"
) {
  await supabase
    .from("partners")
    .update({ status })
    .eq("id", partnerId);

  loadRows();
}


  if (loading) return <div className="p-6">Loading partners…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Partners</h1>
          <span className="text-sm text-gray-600">Total: {filteredRows.length}</span>
        </div>

        <p className="text-sm text-gray-500 mb-3">Doorplace USA — Partner Control Panel</p>

        {/* BULK REPAIR */}
        <div className="flex gap-3 items-center flex-wrap mb-3">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={repairDryRun}
              onChange={(e) => setRepairDryRun(e.target.checked)}
            />
            Dry Run
          </label>

          <button
            className="bg-black text-white px-4 py-1 rounded text-sm"
            onClick={async () => {
              if (repairRunning) return;
              if (!confirm("Run bulk repair + sync for ALL partners?")) return;

              setRepairRunning(true);
              setRepairResult(null);
              setRepairLogs([]);

              const res = await fetch("/api/partners/bulk-repair", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dryRun: repairDryRun }),
              });

              const json = await res.json();
              setRepairResult(json);
              setRepairLogs(json.logs || []);
              setRepairRunning(false);
              loadRows();
            }}
          >
            {repairRunning ? "Running…" : "Repair / Sync All Partners"}
          </button>
        </div>

        {/* RESULTS */}
        {repairResult?.success && (
          <div className="bg-gray-100 border rounded p-3 text-xs space-y-1">
            <div>
              <b>Bulk Repair Results</b>
            </div>
            <div>Repaired: {repairResult.repaired ?? 0}</div>
            <div>Emails Sent: {repairResult.emailsSent ?? 0}</div>
            <div>Already Clean: {repairResult.alreadyClean ?? 0}</div>
            <div>Skipped: {repairResult.skipped ?? 0}</div>
          </div>
        )}

        {/* LOGS */}
        {repairLogs.length > 0 && (
          <div className="mt-2 bg-black text-green-400 font-mono text-xs rounded p-3 max-h-40 overflow-y-auto">
            {repairLogs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}

        {/* SEARCH / SORT */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search name, email, or Partner ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 w-full md:w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

    {/* TABLE */}
<AdminTable<Partner>
  columns={[
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ]}
  rows={filteredRows}
  rowKey={(p) => p.id}
  renderCell={(p, key) => {
    switch (key) {
      case "name":
        return (
          <span className="font-medium">
            {p.first_name} {p.last_name}
          </span>
        );

      case "status":
  return (
    <select
      className={`text-xs font-semibold border rounded px-2 py-1 ${
        p.status === "active"
          ? "text-green-700"
          : p.status === "pending"
          ? "text-orange-700"
          : "text-gray-500"
      }`}
      value={p.status}
      onChange={(e) =>
        updatePartnerStatus(
          p.id,
          e.target.value as "active" | "pending"
        )
      }
    >
      <option value="pending">● Pending</option>
      <option value="active">● Active</option>
    </select>
  );



      case "actions":
        return (
          <select
            className="border rounded px-2 py-1 text-xs w-full max-w-[140px]"
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (v === "view") setViewItem(p);
              if (v === "edit") setEditItem(p);
              if (v === "welcome") runAction("send_welcome_email", p);
              if (v === "regen") runAction("regenerate_partner_id", p);
              if (v === "delete") runAction("delete_partner", p);
            }}
          >
            <option value="">Select</option>
            <option value="view">View</option>
            <option value="edit">Edit</option>
            <option value="welcome">Send Welcome Email</option>
            <option value="regen">Regenerate ID</option>
            <option value="delete">Delete</option>
          </select>
        );
    }
  }}
/>

{/* ===============================
    VIEW MODAL — PARTNER PROFILE
================================ */}
{viewItem && (
  <div
    className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4"
    onClick={() => setViewItem(null)}
  >
    {/* MODAL CONTAINER */}
    <div
      className="bg-white rounded max-w-2xl w-full max-h-[77vh] flex flex-col shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Partner Profile</h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* BASIC INFO */}
        <div>
          <h3 className="font-semibold mb-1">Basic Information</h3>
          <p><b>Name:</b> {viewItem.first_name} {viewItem.last_name}</p>
          <p><b>Email:</b> {viewItem.email_address}</p>
          <p><b>Phone:</b> {viewItem.cell_phone_number}</p>
          <p><b>Partner ID:</b> {viewItem.partner_id}</p>
        </div>

        {/* BUSINESS INFO */}
        <div>
          <h3 className="font-semibold mb-1">Business Information</h3>
          <p><b>Business Name:</b> {viewItem.business_name || "—"}</p>
          <p><b>Coverage Area:</b> {viewItem.coverage_area || "—"}</p>
          <p><b>Preferred Contact:</b> {viewItem.preferred_contact_method || "—"}</p>
          <p><b>Sales Experience:</b> {viewItem.sales_experience || "—"}</p>
        </div>

        {/* ADDRESS */}
        <div>
          <h3 className="font-semibold mb-1">Address</h3>
          <p><b>Street:</b> {viewItem.street_address || "—"}</p>
          <p><b>City:</b> {viewItem.city || "—"}</p>
          <p><b>State:</b> {viewItem.state || "—"}</p>
          <p><b>Zip:</b> {viewItem.zip_code || "—"}</p>
        </div>

        {/* SYSTEM STATUS */}
        <div>
  <h3 className="font-semibold mb-1">System Status</h3>

  <p>
    <b>Partner Status:</b>{" "}
    <span
      className={
        viewItem.status === "active"
          ? "text-green-700 font-semibold"
          : viewItem.status === "pending"
          ? "text-orange-700 font-semibold"
          : "text-gray-500 font-semibold"
      }
    >
      {viewItem.status}
    </span>
  </p>

  <p>
    <b>Account Email Confirmed:</b>{" "}
    {viewItem.email_verified ? "Yes" : "No"}
  </p>
  <p>
  <b>Welcome Email Sent:</b>{" "}
  {viewItem.welcome_email_sent ? "Yes" : "No"}
</p>
</div>




        {/* TRACKING LINK */}
        <div>
          <h3 className="font-semibold mb-1">Partner Tracking Link</h3>

          {viewItem.tracking_link ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={viewItem.tracking_link}
                className="w-full border px-2 py-1 rounded text-sm bg-gray-50"
              />
              <button
                className="bg-black text-white px-3 py-1 rounded text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(viewItem.tracking_link);
                  alert("Tracking link copied!");
                }}
              >
                Copy
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">—</p>
          )}
        </div>

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
    <div className="bg-white p-6 rounded max-w-2xl w-full max-h-[75vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Edit Partner</h2>

      {/* BASIC INFO */}
      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="First Name"
        value={editItem.first_name}
        onChange={(e) =>
          setEditItem({ ...editItem, first_name: e.target.value })
        }
      />

      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="Last Name"
        value={editItem.last_name}
        onChange={(e) =>
          setEditItem({ ...editItem, last_name: e.target.value })
        }
      />

      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="Email Address"
        value={editItem.email_address}
        onChange={(e) =>
          setEditItem({ ...editItem, email_address: e.target.value })
        }
      />

      <input
        className="border w-full mb-4 px-3 py-2"
        placeholder="Phone Number"
        value={editItem.cell_phone_number}
        onChange={(e) =>
          setEditItem({ ...editItem, cell_phone_number: e.target.value })
        }
      />

      {/* BUSINESS INFO */}
      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="Business Name"
        value={editItem.business_name || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, business_name: e.target.value })
        }
      />

      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="Coverage Area"
        value={editItem.coverage_area || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, coverage_area: e.target.value })
        }
      />

      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="Preferred Contact Method"
        value={editItem.preferred_contact_method || ""}
        onChange={(e) =>
          setEditItem({
            ...editItem,
            preferred_contact_method: e.target.value,
          })
        }
      />

      <input
        className="border w-full mb-4 px-3 py-2"
        placeholder="Sales Experience"
        value={editItem.sales_experience || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, sales_experience: e.target.value })
        }
      />

      {/* ADDRESS */}
      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="Street Address"
        value={editItem.street_address || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, street_address: e.target.value })
        }
      />

      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="City"
        value={editItem.city || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, city: e.target.value })
        }
      />

      <input
        className="border w-full mb-2 px-3 py-2"
        placeholder="State"
        value={editItem.state || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, state: e.target.value })
        }
      />

      <input
        className="border w-full mb-4 px-3 py-2"
        placeholder="Zip Code"
        value={editItem.zip_code || ""}
        onChange={(e) =>
          setEditItem({ ...editItem, zip_code: e.target.value })
        }
      />

      {/* READ-ONLY INFO */}
      {/* READ-ONLY INFO */}
<div className="text-xs text-gray-500 mb-4 space-y-1">
  <div>
    <b>Partner ID:</b> {editItem.partner_id}
  </div>

  <div>
    <b>Partner Status:</b>{" "}
    <span
      className={
        editItem.status === "active"
          ? "text-green-700 font-semibold"
          : editItem.status === "pending"
          ? "text-orange-700 font-semibold"
          : "text-gray-500 font-semibold"
      }
    >
      {editItem.status}
    </span>
  </div>

  <div>
    <b>Account Email Confirmed:</b>{" "}
    {editItem.email_verified ? "Yes" : "No"}
  </div>
</div>


      {/* ACTIONS */}
      <div className="flex gap-2">
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
