"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable";

/* ===============================
   TYPES
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
  business_name?: string;
  coverage_area?: string;
  preferred_contact_method?: string;
  sales_experience?: string;
  onboarding_email_sent?: boolean;
  tracking_link?: string;
  shopify_synced?: boolean;
};

type BulkRepairResponse = {
  success: boolean;
  repaired?: number;
  emailsSent?: number;
  alreadyClean?: number;
  skipped?: number;
  dryRun?: boolean;
  logs?: string[];
  error?: string;
};

/* ===============================
   PAGE
================================ */
export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  const [viewPartner, setViewPartner] = useState<Partner | null>(null);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);

  /* BULK REPAIR */
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairDryRun, setRepairDryRun] = useState(false);
  const [repairResult, setRepairResult] =
    useState<BulkRepairResponse | null>(null);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);

  /* LOAD PARTNERS */
  async function loadPartners() {
    setLoading(true);
    const { data } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: sort === "oldest" });

    setPartners(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPartners();
  }, [sort]);

  /* ACTIONS */
  async function runAction(
    action:
      | "regenerate_partner_id"
      | "send_onboarding_email"
      | "delete_partner"
      | "sync_shopify_tags",
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

    loadPartners();
  }

  /* SAVE EDIT */
  async function saveEdit() {
    if (!editPartner) return;

    await supabase
      .from("partners")
      .update({
        first_name: editPartner.first_name,
        last_name: editPartner.last_name,
        email_address: editPartner.email_address,
        cell_phone_number: editPartner.cell_phone_number,
        street_address: editPartner.street_address,
        city: editPartner.city,
        state: editPartner.state,
        zip_code: editPartner.zip_code,
      })
      .eq("id", editPartner.id);

    setEditPartner(null);
    loadPartners();
  }

  /* FILTER */
  const filteredPartners = useMemo(() => {
    let list = [...partners];

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
  }, [partners, search, sort]);

  if (loading) return <div className="p-6">Loading partners…</div>;

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4">


      {/* HEADER — SAME AS LEADS */}
      <div className="sticky top-0 z-30 bg-white border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Partners</h1>
          <span className="text-sm text-gray-600">
            Total: {filteredPartners.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-2">
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
              loadPartners();
            }}
          >
            {repairRunning ? "Running…" : "Repair / Sync All Partners"}
          </button>
        </div>

        {/* RESULTS */}
        {repairResult?.success && (
          <div className="bg-gray-100 border rounded p-3 text-xs space-y-1">
            <div><b>Bulk Repair Results</b></div>
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
        <div className="flex gap-2 mt-2">
          <input
            className="border rounded px-3 py-2 w-full"

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
      <AdminTable
        columns={[
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
        ]}
        rows={filteredPartners}
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
              return p.shopify_synced ? (
                <span className="text-xs font-semibold text-green-700">● Approved</span>
              ) : (
                <span className="text-xs font-semibold text-orange-700">● Not Approved</span>
              );

            case "actions":
              return (
                <select
                  className="border rounded px-2 py-1 text-xs"
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (v === "view") setViewPartner(p);
                    if (v === "edit") setEditPartner(p);
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
      {viewPartner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-3">Partner Profile</h2>

            <p><b>Name:</b> {viewPartner.first_name} {viewPartner.last_name}</p>
            <p><b>Email:</b> {viewPartner.email_address}</p>
            <p><b>Phone:</b> {viewPartner.cell_phone_number}</p>
            <p><b>Partner ID:</b> {viewPartner.partner_id}</p>

            <p className="mt-2">
              <b>Address:</b><br />
              {viewPartner.street_address}<br />
              {viewPartner.city}, {viewPartner.state} {viewPartner.zip_code}
            </p>

            <button
              className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              onClick={() => setViewPartner(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editPartner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full">
            <h2 className="text-xl font-bold mb-3">Edit Partner</h2>

            {[
              "first_name",
              "last_name",
              "email_address",
              "cell_phone_number",
              "street_address",
              "city",
              "state",
              "zip_code",
            ].map((field) => (
              <input
                key={field}
                className="border w-full mb-2 px-3 py-2"
                placeholder={field.replace("_", " ")}
                value={(editPartner as any)[field] || ""}
                onChange={(e) =>
                  setEditPartner({
                    ...editPartner,
                    [field]: e.target.value,
                  })
                }
              />
            ))}

            <div className="flex gap-2 mt-3">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded flex-1"
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded flex-1"
                onClick={() => setEditPartner(null)}
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
