"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable";


/* ===============================
   TYPES
=============================== */
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

type SystemSettings = {
  id: string;
  approval_mode: "manual" | "automatic";
};

/* ✅ Bulk repair response (what we expect back) */
type BulkRepairResponse = {
  success: boolean;
  repaired?: number;
  emailsSent?: number;
  alreadyClean?: number;
  skipped?: number;
  dryRun?: boolean;
  logs?: string[]; // optional
  error?: string;
};

/* ===============================
   PAGE
=============================== */
export default function PartnersPage() {
  /* ---------- core state ---------- */
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  const [viewPartner, setViewPartner] = useState<Partner | null>(null);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);

  /* ---------- GLOBAL APPROVAL MODE (FIXED: persists) ---------- */
  const [systemSettings, setSystemSettings] =
    useState<SystemSettings | null>(null);

  /* ✅ BULK REPAIR UI STATE (ADDED) */
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairDryRun, setRepairDryRun] = useState(false);
  const [repairResult, setRepairResult] = useState<BulkRepairResponse | null>(
    null
  );
  const [repairLogs, setRepairLogs] = useState<string[]>([]);

  /* ===============================
     LOAD SYSTEM SETTINGS (FIXED)
  =============================== */
  useEffect(() => {
    supabase
      .from("system_settings")
      .select("id, approval_mode")
      .single()
      .then(({ data }) => {
        if (data) setSystemSettings(data);
      });
  }, []);

  async function toggleApprovalMode() {
    if (!systemSettings) return;

    const newMode =
      systemSettings.approval_mode === "manual" ? "automatic" : "manual";

    await supabase
      .from("system_settings")
      .update({ approval_mode: newMode })
      .eq("id", systemSettings.id); // ✅ REQUIRED so it actually persists

    setSystemSettings({
      ...systemSettings,
      approval_mode: newMode,
    });
  }

  /* ===============================
     LOAD PARTNERS
  =============================== */
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

  /* ===============================
     ACTIONS
=============================== */
async function runAction(
  action:
    | "regenerate_partner_id"
    | "approve_partner"
    | "send_onboarding_email"
    | "delete_partner"
    | "sync_shopify_tags",
  partner: Partner
) {
  if (
    !confirm(`Run ${action.replaceAll("_", " ")} for ${partner.email_address}?`)
  )
    return;

  const res = await fetch("/api/partners/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      partner_id: partner.partner_id,
      email_address: partner.email_address,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    alert(json.error || "Action failed");
    return;
  }

  await loadPartners();
}



  /* ===============================
     SAVE EDIT
  =============================== */
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

  /* ===============================
     FILTER + SORT
  =============================== */
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

  const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", className: "hidden md:table-cell" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];


  if (loading || !systemSettings)
    return <div className="p-6">Loading partners…</div>;

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-6 pt-0 pb-6 space-y-4 max-w-full overflow-x-hidden">
      {/* ==========================
            HEADER (STICKY)
      =========================== */}
      <div className="sticky top-0 z-30 bg-white pb-4 border-b shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700 leading-tight">
            Partners
          </h1>
          <span className="text-sm text-gray-600">
            Total: {filteredPartners.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-2">
          Doorplace USA — Partner Control Panel
        </p>

        {/* GLOBAL APPROVAL TOGGLE + BULK REPAIR */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-sm font-medium">Approval Mode:</span>

          <button
            onClick={toggleApprovalMode}
            className={`px-4 py-1 rounded text-sm font-bold ${
              systemSettings.approval_mode === "automatic"
                ? "bg-green-600 text-white"
                : "bg-orange-500 text-white"
            }`}
          >
            {systemSettings.approval_mode === "automatic"
              ? "Automatic"
              : "Manual"}
          </button>

          {/* ✅ DRY RUN TOGGLE (ADDED) */}
          <label className="flex items-center gap-2 text-xs ml-2 select-none">
            <input
              type="checkbox"
              checked={repairDryRun}
              onChange={(e) => setRepairDryRun(e.target.checked)}
            />
            Dry Run
          </label>

          {/* BULK REPAIR BUTTON (UPGRADED: progress + results) */}
          <button
            onClick={async () => {
              if (repairRunning) return;

              setRepairResult(null);
              setRepairLogs([]);

              if (!confirm("Run bulk repair + sync for ALL partners?")) return;

              try {
                setRepairRunning(true);

                const res = await fetch("/api/partners/bulk-repair", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ dryRun: repairDryRun }),
                });

                const json: BulkRepairResponse = await res.json();

                if (!res.ok) {
                  alert(json.error || "Bulk repair failed");
                  return;
                }

                setRepairResult(json);
                setRepairLogs(json.logs || []);

                alert("Bulk repair + sync completed");
                loadPartners();
              } catch (e: any) {
                alert(e?.message || "Bulk repair failed");
              } finally {
                setRepairRunning(false);
              }
            }}
            className={`px-4 py-1 rounded text-sm font-bold ${
              repairRunning ? "bg-gray-400 text-white" : "bg-black text-white"
            }`}
          >
            {repairRunning ? "Running…" : "Repair / Sync All Partners"}
          </button>
        </div>

        {/* ✅ RESULT SUMMARY UI (ADDED) */}
        {repairResult?.success && (
          <div className="bg-gray-100 border rounded p-3 text-xs space-y-1">
            <div>
              <b>Bulk Repair Results</b>
              {typeof repairResult.dryRun === "boolean"
                ? ` (Dry Run: ${repairResult.dryRun ? "YES" : "NO"})`
                : ""}
            </div>
            <div>Repaired: {repairResult.repaired ?? 0}</div>
            <div>Emails Sent: {repairResult.emailsSent ?? 0}</div>
            <div>Already Clean: {repairResult.alreadyClean ?? 0}</div>
            <div>Skipped: {repairResult.skipped ?? 0}</div>
          </div>
        )}

        {/* ✅ LOGS UI (ADDED) */}
        {repairLogs.length > 0 && (
          <div className="mt-2 bg-black text-green-400 font-mono text-xs rounded p-3 max-h-48 overflow-y-auto">
            {repairLogs.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        )}

        {/* SEARCH / SORT */}
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Search name, email, or Partner ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:max-w-sm"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="border rounded px-3 py-2 w-full md:w-auto"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* ==========================
            TABLE
      =========================== */}
      <AdminTable
  columns={columns}
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

      case "email":
        return (
          <span className="truncate hidden md:block">
            {p.email_address}
          </span>
        );

      case "status":
        return p.shopify_synced ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
            ● Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
            ● Not Approved
          </span>
        );

      case "actions":
        return (
          <select
            className="border rounded px-2 py-1 text-xs w-full"
            onChange={(e) => {
              const val = e.target.value;
              e.target.value = "";

              if (val === "view") setViewPartner(p);
              if (val === "edit") setEditPartner(p);
              if (val === "regen") runAction("regenerate_partner_id", p);
              if (val === "email") runAction("send_onboarding_email", p);
              if (val === "shopify") runAction("sync_shopify_tags", p);
              if (val === "delete") runAction("delete_partner", p);
            }}
          >
            <option value="">Select</option>
            <option value="view">View</option>
            <option value="edit">Edit</option>
            <option value="regen">Regenerate ID</option>
            <option value="email" disabled={p.onboarding_email_sent}>
              {p.onboarding_email_sent ? "Email Already Sent" : "Send Email"}
            </option>
            <option value="shopify">Sync Shopify</option>
            <option value="delete">Delete</option>
          </select>
        );

      default:
        return null;
    }
  }}
/>


      {/* ==========================
            VIEW MODAL
      =========================== */}
      {viewPartner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-3">Partner Profile</h2>

            <p>
              <b>Name:</b> {viewPartner.first_name} {viewPartner.last_name}
            </p>
            <p>
              <b>Email:</b> {viewPartner.email_address}
            </p>
            <p>
              <b>Phone:</b> {viewPartner.cell_phone_number}
            </p>
            <p>
              <b>Partner ID:</b> {viewPartner.partner_id}
            </p>

            <p>
              <b>Onboarded:</b>{" "}
              {new Date(viewPartner.created_at).toLocaleString()}
            </p>

            <p className="break-all mt-2">
              <b>Tracking Link:</b>
              <br />
              {viewPartner.tracking_link ||
                `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${viewPartner.partner_id}`}
            </p>

            <p className="mt-2">
              <b>Address:</b>
              <br />
              {viewPartner.street_address}
              <br />
              {viewPartner.city}, {viewPartner.state} {viewPartner.zip_code}
            </p>

            <p>
              <b>Business Name:</b> {viewPartner.business_name}
            </p>
            <p>
              <b>Coverage Area:</b> {viewPartner.coverage_area}
            </p>
            <p>
              <b>Preferred Contact:</b> {viewPartner.preferred_contact_method}
            </p>
            <p>
              <b>Sales Experience:</b> {viewPartner.sales_experience}
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

      {/* ==========================
            EDIT MODAL
      =========================== */}
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
