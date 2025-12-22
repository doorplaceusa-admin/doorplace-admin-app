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
  created_at: string;

  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  shopify_synced?: boolean;
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
   PAGE (TEMPLATE + PARTNER LOGIC)
================================ */
export default function PartnersPage() {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  const [viewItem, setViewItem] = useState<Partner | null>(null);
  const [editItem, setEditItem] = useState<Partner | null>(null);

  /* ===== BULK REPAIR ===== */
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairDryRun, setRepairDryRun] = useState(false);
  const [repairResult, setRepairResult] = useState<BulkRepairResponse | null>(null);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);

  /* ===============================
     LOAD PARTNERS
  ================================ */
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
  }, [sort]);

  /* ===============================
     FILTER
  ================================ */
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
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        )
      );
    }

    return list;
  }, [rows, search, sort]);

  /* ===============================
     ACTIONS
  ================================ */
  async function runAction(
    action:
      | "regenerate_partner_id"
      | "send_onboarding_email"
      | "sync_shopify_tags"
      | "delete_partner",
    partner: Partner
  ) {
    if (!confirm(`Run ${action.replaceAll("_", " ")} for ${partner.email_address}?`))
      return;

    await fetch("/api/partners/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        partner_id: partner.partner_id,
        email_address: partner.email_address,
      }),
    });

    loadRows();
  }

  /* ===============================
     SAVE EDIT
  ================================ */
  async function saveEdit() {
    if (!editItem) return;

    await supabase
      .from("partners")
      .update({
        first_name: editItem.first_name,
        last_name: editItem.last_name,
        email_address: editItem.email_address,
        cell_phone_number: editItem.cell_phone_number,
        street_address: editItem.street_address,
        city: editItem.city,
        state: editItem.state,
        zip_code: editItem.zip_code,
      })
      .eq("id", editItem.id);

    setEditItem(null);
    loadRows();
  }

  if (loading) return <div className="p-6">Loading partners…</div>;

  /* ===============================
     TEMPLATE RENDER
  ================================ */
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-6 pb-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Partners</h1>
          <span className="text-sm text-gray-600">Total: {filteredRows.length}</span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Doorplace USA — Partner Control Panel
        </p>

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

        {/* SEARCH / SORT */}
        <div className="flex gap-2 flex-wrap">
          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search name, email, or Partner ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2"
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
                <div className="flex flex-col">
                  <span className="font-medium">{p.first_name}</span>
                  <span className="text-xs text-gray-500">{p.last_name}</span>
                </div>
              );

            case "status":
              return p.shopify_synced ? (
                <span className="text-xs font-semibold text-green-700">● Approved</span>
              ) : (
                <span className="text-xs font-semibold text-orange-700">
                  ● Not Approved
                </span>
              );

            case "actions":
              return (
                <select
                  className="border rounded px-2 py-1 text-xs"
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (v === "view") setViewItem(p);
                    if (v === "edit") setEditItem(p);
                    if (v === "regen") runAction("regenerate_partner_id", p);
                    if (v === "email") runAction("send_onboarding_email", p);
                    if (v === "shopify") runAction("sync_shopify_tags", p);
                    if (v === "delete") runAction("delete_partner", p);
                  }}
                >
                  <option value="">Select</option>
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                  <option value="regen">Regenerate ID</option>
                  <option value="email">Send Approval Email</option>
                  <option value="shopify">Sync Shopify</option>
                  <option value="delete">Delete</option>
                </select>
              );
          }
        }}
      />

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full">
            <h2 className="text-xl font-bold mb-3">Partner Profile</h2>

            <p><b>Name:</b> {viewItem.first_name} {viewItem.last_name}</p>
            <p><b>Email:</b> {viewItem.email_address}</p>
            <p><b>Phone:</b> {viewItem.cell_phone_number}</p>
            <p><b>Partner ID:</b> {viewItem.partner_id}</p>

            <button
              className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              onClick={() => setViewItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full">
            <h2 className="text-xl font-bold mb-3">Edit Partner</h2>

            {["first_name", "last_name", "email_address", "cell_phone_number"].map(
              (f) => (
                <input
                  key={f}
                  className="border w-full mb-2 px-3 py-2"
                  placeholder={f.replace("_", " ")}
                  value={(editItem as any)[f] || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, [f]: e.target.value })
                  }
                />
              )
            )}

            <div className="flex gap-2 mt-3">
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
