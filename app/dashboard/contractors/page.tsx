"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable"; // Adjust path if needed
import { useSearchParams } from "next/navigation";

/* ===============================
   TYPES
================================ */

type Contractor = {
  id: string;
  name: string;
  phone: string;
  email: string;
  business_name?: string;
  website?: string;

  address: string;
  city: string;
  state: string;
  zip: string;

  coverage_area?: string;
  experience?: string;

  services?: string[];
  other_services?: string;

  signature: string;
  agreed: boolean;

  created_at: string;
};

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ===============================
   PAGE
================================ */

export default function ContractorsPage() {
  const [rows, setRows] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Contractor | null>(null);
  const [editItem, setEditItem] = useState<Contractor | null>(null);
  const [layout, setLayout] = useState<"cards" | "table">("cards");
  
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("id");

  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  async function loadRows() {
    setLoading(true);

    let query = supabase.from("contractors").select("*");

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, [sort]);

  // 🔥 AUTO OPENS CONTRACTOR IF ?id= IS IN URL
  useEffect(() => {
    if (!highlightId || !rows.length) return;

    const found = rows.find((c) => String(c.id) === String(highlightId));

    if (found) {
      setViewItem(found);
    }
  }, [highlightId, rows]);

  /* ===============================
     SEARCH & SORT LOGIC
  ================================= */

  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        `${c.name} ${c.city} ${c.state} ${c.zip} ${c.email} ${c.phone}`
          .toLowerCase()
          .includes(q)
      );
    }

    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [rows, search, sort]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this contractor?")) return;
    await supabase.from("contractors").delete().eq("id", id);
    loadRows();
  }

  if (loading) return <div className="p-6">Loading contractors…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-375 w-full mx-auto">
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4 pt-6 px-6 sm:px-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Contractors</h1>
          <span className="text-sm text-gray-600">Total: {filteredRows.length}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
  <a
    href="https://doorplaceusa.com/pages/join-our-independent-contractor-network-doorplace-usa"
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-blue-600 underline"
  >
    Open Contractor Signup Page
  </a>

  <button
    onClick={() =>
      navigator.clipboard.writeText(
        "https://doorplaceusa.com/pages/join-our-independent-contractor-network-doorplace-usa"
      )
    }
    className="text-xs border px-2 py-1 rounded hover:bg-gray-100"
  >
    Copy Link
  </button>
</div>

        {/* LAYOUT TOGGLE */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Layout</span>
          <button
            className={`px-3 py-1 rounded text-xs border ${
              layout === "cards" ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setLayout("cards")}
          >
            Cards
          </button>
          <button
            className={`px-3 py-1 rounded text-xs border ${
              layout === "table" ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setLayout("table")}
          >
            Table
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex gap-2 flex-wrap">
          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search name, city, state, zip, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 w-full md:w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      <div className="px-6 sm:px-0">
        {/* CARDS LAYOUT */}
        {layout === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRows.map((c) => (
              <div key={c.id} className="border rounded-lg p-4 shadow-sm bg-white space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div><b>Phone:</b> {c.phone}</div>
                  <div><b>Location:</b> {c.city}, {c.state} {c.zip}</div>
                  <div><b>Joined:</b> {formatDate(c.created_at)}</div>
                  <div><b>Business:</b> {c.business_name || "—"}</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    className="text-xs border px-3 py-1 rounded hover:bg-gray-50"
                    onClick={() => setViewItem(c)}
                  >
                    View
                  </button>

                  <button
                    className="text-xs border px-3 py-1 rounded hover:bg-gray-50"
                    onClick={() => setEditItem(c)}
                  >
                    Edit
                  </button>

                  <select
                    className="text-xs border px-2 py-1 rounded flex-1"
                    onChange={(e) => {
                      const v = e.target.value;
                      e.target.value = "";
                      if (v === "delete") handleDelete(c.id);
                    }}
                  >
                    <option value="">Actions</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE LAYOUT */}
        {layout === "table" && (
          <AdminTable<Contractor>
            columns={[
              { key: "name", label: "Name" },
              { key: "contact", label: "Contact Info" },
              { key: "location", label: "Location" },
              { key: "actions", label: "Actions" },
            ]}
            rows={filteredRows}
            rowKey={(c) => c.id}
            renderCell={(c, key) => {
              switch (key) {
                case "name":
                  return (
                    <div>
                      <span className="font-medium block">{c.name}</span>
                      <span className="text-xs text-gray-500">{c.business_name}</span>
                    </div>
                  );
                case "contact":
                  return (
                    <div className="text-sm">
                      <div>{c.email}</div>
                      <div className="text-xs text-gray-500">{c.phone}</div>
                    </div>
                  );
                case "location":
                  return (
                    <span className="text-sm">
                      {c.city}, {c.state} {c.zip}
                    </span>
                  );
                case "actions":
                  return (
                    <select
                      className="border rounded px-2 py-1 text-xs w-full max-w-35"
                      onChange={(e) => {
                        const v = e.target.value;
                        e.target.value = "";
                        if (v === "view") setViewItem(c);
                        if (v === "edit") setEditItem(c);
                        if (v === "delete") handleDelete(c.id);
                      }}
                    >
                      <option value="">Select</option>
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      <option value="delete">Delete</option>
                    </select>
                  );
              }
            }}
          />
        )}
      </div>

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded max-w-2xl w-full max-h-[77vh] flex flex-col shadow-lg mt-10" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Contractor Profile</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 border-b pb-1 mb-2">Basic Information</h3>
                <p><b>Name:</b> {viewItem.name}</p>
                <p><b>Email:</b> {viewItem.email}</p>
                <p><b>Phone:</b> {viewItem.phone}</p>
                <p><b>Business Name:</b> {viewItem.business_name || "—"}</p>
                <p><b>Website:</b> {viewItem.website || "—"}</p>
                <p><b>Joined Date:</b> {formatDate(viewItem.created_at)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 border-b pb-1 mb-2">Location & Coverage</h3>
                <p><b>Address:</b> {viewItem.address}</p>
                <p><b>City:</b> {viewItem.city}</p>
                <p><b>State:</b> {viewItem.state}</p>
                <p><b>ZIP:</b> {viewItem.zip}</p>
                <p className="mt-2"><b>Coverage Area:</b> {viewItem.coverage_area || "—"}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 border-b pb-1 mb-2">Experience & Services</h3>
                <p><b>Experience:</b> {viewItem.experience || "—"}</p>
                <p className="mt-2"><b>Selected Services:</b> {viewItem.services?.join(", ") || "None selected"}</p>
                <p className="mt-2"><b>Other Services:</b> {viewItem.other_services || "—"}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 border-b pb-1 mb-2">Agreements</h3>
                <p><b>Agreed to Terms:</b> {viewItem.agreed ? "Yes" : "No"}</p>
                <p><b>Digital Signature:</b> {viewItem.signature}</p>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b">
              <button className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition-colors" onClick={() => setViewItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)}>
          <div className="bg-white p-6 rounded max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Contractor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {[
                ["Full Name", "name"],
                ["Email", "email"],
                ["Phone", "phone"],
                ["Business Name", "business_name"],
                ["Website", "website"],
                ["Street Address", "address"],
                ["City", "city"],
                ["State", "state"],
                ["ZIP Code", "zip"],
                ["Coverage Area", "coverage_area"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    className="border rounded w-full px-3 py-2 text-sm"
                    value={(editItem as any)[key] || ""}
                    onChange={(e) => setEditItem({ ...editItem, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Experience</label>
              <textarea
                className="border rounded w-full px-3 py-2 text-sm"
                rows={3}
                value={editItem.experience || ""}
                onChange={(e) => setEditItem({ ...editItem, experience: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Other Services</label>
              <textarea
                className="border rounded w-full px-3 py-2 text-sm"
                rows={2}
                value={editItem.other_services || ""}
                onChange={(e) => setEditItem({ ...editItem, other_services: e.target.value })}
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button
                className="bg-red-700 text-white px-4 py-2 rounded flex-1 hover:bg-red-800 transition-colors"
                onClick={async () => {
                  await supabase.from("contractors").update(editItem).eq("id", editItem.id);
                  setEditItem(null);
                  loadRows();
                }}
              >
                Save Changes
              </button>

              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex-1 hover:bg-gray-300 transition-colors"
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