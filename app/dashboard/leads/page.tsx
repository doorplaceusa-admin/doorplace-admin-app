"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type Lead = {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  customer_email?: string;
  customer_phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  project_type?: string;
  size_needed?: string;
  installation_needed?: string;
  project_details?: string;
  lead_status?: string;
  partner_id?: string;
  lead_source?: string;
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

  /* ===============================
     LOAD LEADS
  ================================ */
  async function loadLeads() {
    setLoading(true);

    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    setLeads(data || []);
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
      `${l.first_name} ${l.last_name} ${l.customer_email} ${l.lead_id}`
        .toLowerCase()
        .includes(q)
    );
  }, [leads, search]);

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
        customer_email: editLead.customer_email,
        customer_phone: editLead.customer_phone,
        street_address: editLead.street_address,
        city: editLead.city,
        state: editLead.state,
        zip_code: editLead.zip_code,
        lead_status: editLead.lead_status,
        partner_id: editLead.partner_id,
      })
      .eq("id", editLead.id);

    setEditLead(null);
    loadLeads();
  }

  /* ===============================
     DELETE
  ================================ */
  async function deleteLead(lead: Lead) {
    if (!confirm(`Delete lead ${lead.lead_id}?`)) return;

    await supabase.from("leads").delete().eq("id", lead.id);
    loadLeads();
  }

  if (loading) return <div className="p-6">Loading leads…</div>;

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-6 pb-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white pb-4 border-b shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Leads</h1>
          <span className="text-sm text-gray-600">
            Total: {filteredLeads.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Doorplace USA — Lead Management
        </p>

        <input
          className="border rounded px-3 py-2 w-full md:max-w-sm"
          placeholder="Search name, email, or Lead ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-3 py-3 text-left w-[30%]">Name</th>
              <th className="px-3 py-3 text-left hidden md:table-cell w-[30%]">
                Email
              </th>
              <th className="px-3 py-3 text-left w-[15%]">Lead ID</th>
              <th className="px-3 py-3 text-left w-[15%]">Status</th>
              <th className="px-3 py-3 text-left w-[10%]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeads.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-3 font-medium truncate">
                  {l.first_name} {l.last_name}
                </td>

                <td className="px-3 py-3 hidden md:table-cell truncate">
                  {l.customer_email || "—"}
                </td>

                <td className="px-3 py-3 font-mono text-xs truncate">
                  {l.lead_id}
                </td>

                <td className="px-3 py-3">
                  <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                    {l.lead_status || "new"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <select
                    className="border rounded px-2 py-1 text-xs w-full"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {viewLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-3">Lead Profile</h2>

            <p><b>Lead ID:</b> {viewLead.lead_id}</p>
            <p><b>Name:</b> {viewLead.first_name} {viewLead.last_name}</p>
            <p><b>Email:</b> {viewLead.customer_email}</p>
            <p><b>Phone:</b> {viewLead.customer_phone}</p>

            <p className="mt-2">
              <b>Address:</b><br />
              {viewLead.street_address}<br />
              {viewLead.city}, {viewLead.state} {viewLead.zip_code}
            </p>

            <p className="mt-2"><b>Project:</b> {viewLead.project_type}</p>
            <p><b>Size:</b> {viewLead.size_needed}</p>
            <p><b>Installation:</b> {viewLead.installation_needed}</p>
            <p><b>Status:</b> {viewLead.lead_status}</p>
            <p><b>Partner ID:</b> {viewLead.partner_id || "—"}</p>
            <p><b>Source:</b> {viewLead.lead_source}</p>

            {/* PHOTOS */}
            <div className="mt-3">
              <b>Photos:</b>
              <div className="flex gap-2 flex-wrap mt-2">
                {Array.isArray(viewLead.photos) && viewLead.photos.length > 0 ? (
                  viewLead.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="w-28 h-28 object-cover rounded border"
                    />
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">
                    No photos uploaded
                  </span>
                )}
              </div>
            </div>

            <button
              className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              onClick={() => setViewLead(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-lg w-full">
            <h2 className="text-xl font-bold mb-3">Edit Lead</h2>

            {[
              "first_name",
              "last_name",
              "customer_email",
              "customer_phone",
              "street_address",
              "city",
              "state",
              "zip_code",
              "partner_id",
              "lead_status",
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

            <div className="flex gap-2 mt-3">
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
