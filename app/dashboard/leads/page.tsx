"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable";



/* ===============================
   TYPES
================================ */
type Lead = {
  id: string;
  lead_id: string;

  submission_type?: string;
  quote_type?: string;

  // General / Quote
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  project_details?: string;

  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Swing quote
  swing_size?: string;
  porch_ceiling_height?: string;
  installation_needed?: string;
  hanging_method?: string;

  // Door quote
  door_width?: string;
  door_height?: string;
  number_of_doors?: string;
  door_type?: string;
  door_type_other?: string;
  door_material?: string;
  door_material_other?: string;
  finish_preference?: string;
  door_installation_needed?: string;
  installation_location?: string;

  // Meta
  partner_id?: string;
  lead_status?: string;
  source?: string;
  photos?: string[];
  created_at: string;
};

/* ===============================
   PAGE
================================ */
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /* ===============================
     LOAD LEADS
  ================================ */
  async function loadLeads() {
    setLoading(true);

    const { data } = await supabase
      .from("leads")
      .select("*")
      .or("submission_type.is.null,submission_type.neq.partner_order")
      .order("created_at", { ascending: false });

    setLeads(data || []);
    setSelectedIds([]);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  /* ===============================
     FILTER
  ================================ */
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) =>
      `${l.first_name} ${l.last_name} ${l.lead_id}`
        .toLowerCase()
        .includes(q)
    );
  }, [leads, search]);

  /* ===============================
     SINGLE DELETE (RESTORED)
  ================================ */
  async function deleteLead(lead: Lead) {
    if (!confirm(`Delete lead ${lead.lead_id}?`)) return;
    await supabase.from("leads").delete().eq("id", lead.id);
    loadLeads();
  }

  /* ===============================
     BULK DELETE
  ================================ */
  async function bulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} leads?`)) return;

    await supabase.from("leads").delete().in("id", selectedIds);
    loadLeads();
  }

  /* ===============================
     SAVE EDIT
  ================================ */
  async function saveEdit() {
    if (!editLead) return;

    await supabase
      .from("leads")
      .update({
        first_name: editLead.first_name,
        last_name: editLead.last_name,
        email: editLead.email,
        phone: editLead.phone,
        street_address: editLead.street_address,
        city: editLead.city,
        state: editLead.state,
        zip: editLead.zip,
        partner_id: editLead.partner_id,
        lead_status: editLead.lead_status,
      })
      .eq("id", editLead.id);

    setEditLead(null);
    loadLeads();
  }

  if (loading) return <div className="p-6">Loading leads…</div>;

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-6 pb-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Leads</h1>
          <span className="text-sm text-gray-600">
            Total: {filteredLeads.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          General Inquiry & Swing / Door Quotes
        </p>

        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search name or Lead ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {selectedIds.length > 0 && (
            <button
              className="bg-red-700 text-white px-4 py-2 rounded text-sm"
              onClick={bulkDelete}
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <AdminTable<Lead>
  columns={[
    { key: "name", label: "Name" },
    { key: "type", label: "Lead Type" },
    { key: "actions", label: "Actions" },
  ]}
  rows={filteredLeads}
  rowKey={(l) => l.id}
  renderCell={(l, key) => {
    switch (key) {
      case "select":
        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(l.id)}
            onChange={(e) =>
              setSelectedIds((prev) =>
                e.target.checked
                  ? [...prev, l.id]
                  : prev.filter((id) => id !== l.id)
              )
            }
          />
        );

      case "name":
        return (
          <span className="font-medium">
            {l.first_name} {l.last_name} 
          </span>
        );

      case "type":
        return (
          <span className="text-xs font-medium">
            {l.submission_type === "general"
              ? "General Inquiry"
              : l.submission_type === "quote"
              ? "Swing / Door Quote"
              : l.submission_type === "partner_tracking"
              ? "Partner Tracking Link"
              : "—"}
          </span>
        );

      case "actions":
        return (
          <select
            className="border rounded px-2 py-1 text-xs w-full max-w-[140px]"
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (v === "view") setViewLead(l);
              if (v === "edit") setEditLead(l);
              if (v === "delete") deleteLead(l);
            }}
          >
            <option value="">Select</option>
            <option value="view">View</option>
            <option value="edit">Edit</option>
            <option value="delete">Delete</option>
          </select>
        );

      default:
        return null;
    }
  }}
/>

{/* ===============================
    VIEW MODAL — LEAD DETAILS
================================ */}
{viewLead && (
  <div
    className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4"
    onClick={() => setViewLead(null)}
  >
    <div
      className="bg-white rounded max-w-3xl w-full max-h-[75vh] flex flex-col shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">
          Lead Details — {viewLead.lead_id}
        </h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* CONTACT */}
        <Section title="Contact">
          <Row label="Name" value={`${viewLead.first_name} ${viewLead.last_name}`} />
          <Row label="Email" value={viewLead.email} />
          <Row label="Phone" value={viewLead.phone} />
          <Row
            label="Address"
            value={`${viewLead.street_address || ""} ${viewLead.city || ""}, ${viewLead.state || ""} ${viewLead.zip || ""}`}
          />
        </Section>

        {/* STATUS */}
        <Section title="Lead Status">
          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            {viewLead.lead_status || "new"}
          </span>
        </Section>

        {/* PARTNER */}
        {viewLead.partner_id && (
          <Section title="Partner Tracking">
            <Row label="Partner ID" value={viewLead.partner_id} />
          </Section>
        )}

        {/* SUBMISSION */}
        <Section title="Submission">
          <Row label="Submission Type" value={viewLead.submission_type} />
          <Row label="Quote Type" value={viewLead.quote_type} />
          <Row label="Project Details" value={viewLead.project_details} />
        </Section>

        {/* PHOTOS */}
        <Section title="Photos">
          <div className="flex gap-2 flex-wrap">
            {viewLead.photos?.length ? (
              viewLead.photos.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  className="w-28 h-28 object-cover border rounded"
                  alt={`lead-photo-${i}`}
                />
              ))
            ) : (
              <span className="text-gray-500 text-sm">No photos uploaded</span>
            )}
          </div>
        </Section>

      </div>

      {/* FOOTER */}
      <div className="p-4 border-t bg-white">
        <button
          className="bg-black text-white px-4 py-2 rounded w-full"
          onClick={() => setViewLead(null)}
        >
          Close

        </button>
      </div>
    </div>
  </div>
)}



      {/* EDIT MODAL */}
      {editLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-6 rounded max-w-3xl w-full max-h-[60vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-3">Edit Lead</h2>

      {/* BASIC INFO */}
      {[
        "first_name",
        "last_name",
        "email",
        "phone",
        "street_address",
        "city",
        "state",
        "zip",
        "partner_id",
      ].map((f) => (
        <input
          key={f}
          className="border w-full mb-2 px-3 py-2"
          placeholder={f.replace("_", " ")}
          value={(editLead as any)[f] || ""}
          onChange={(e) =>
            setEditLead({ ...editLead, [f]: e.target.value })
          }
        />
      ))}

      {/* LEAD STATUS */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">
          Lead Status
        </div>
        <select
          className="border w-full px-3 py-2 rounded"
          value={editLead.lead_status || "new"}
          onChange={(e) =>
            setEditLead({ ...editLead, lead_status: e.target.value })
          }
        >
          {[
            "new",
            "contacted",
            "in_progress",
            "converted_to_order",
            "closed",
            "lost",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-4">
        <button
          className="bg-red-700 text-white px-4 py-2 rounded flex-1"
          onClick={saveEdit}
        >
          Save
        </button>
        <button
          className="bg-gray-300 px-4 py-2 rounded flex-1"
          onClick={() => setEditLead(null)}
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
   HELPERS
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
  if (!value) return null;
  return (
    <p>
      <b>{label}:</b> {value}
    </p>
  );
}
