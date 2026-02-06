// app/dashboard/page-requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "../../components/ui/admintable";

/* ===============================
   TYPES
================================ */

type PageRequest = {
  id: string;
  created_at: string;

  full_name: string;
  email: string;
  phone: string;

  business_type?: string;
  pages_needed?: string;

  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;

  status?: string;
  notes?: string;
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

export default function PageRequestsPage() {
  const [rows, setRows] = useState<PageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<PageRequest | null>(null);

  const [layout, setLayout] = useState<"cards" | "table">("cards");

  async function loadRows() {
    setLoading(true);

    const { data } = await supabase
      .from("tradepilot_page_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        `${r.full_name} ${r.email} ${r.phone} ${r.business_type}`
          .toLowerCase()
          .includes(q)
      );
    }

    return list;
  }, [rows, search]);

  if (loading) return <div className="p-6">Loading requests…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-[1500px] w-full mx-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">
            Page Requests
          </h1>
          <span className="text-sm text-gray-600">
            Total: {filteredRows.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          TradePilot — Local SEO Funnel Submissions
        </p>

        {/* Copy Funnel URL */}
        <div className="flex items-center gap-2 mb-3">
          <input
            readOnly
            value="https://tradepilot.doorplaceusa.com/local-seo-pages"
            className="border rounded px-3 py-2 text-sm w-full max-w-lg bg-gray-50"
          />
          <button
            className="bg-black text-white px-3 py-2 rounded text-sm"
            onClick={() => {
              navigator.clipboard.writeText(
                "https://tradepilot.doorplaceusa.com/local-seo-pages"
              );
              alert("Copied funnel link!");
            }}
          >
            Copy Link
          </button>
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Layout</span>

          <button
            className={`px-3 py-1 rounded text-xs border ${
              layout === "cards"
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setLayout("cards")}
          >
            Cards
          </button>

          <button
            className={`px-3 py-1 rounded text-xs border ${
              layout === "table"
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setLayout("table")}
          >
            Table
          </button>
        </div>

        {/* Search */}
        <input
          className="border rounded px-3 py-2 w-full md:max-w-sm"
          placeholder="Search name, email, phone, business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CARDS VIEW */}
      {layout === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRows.map((r) => (
            <div
              key={r.id}
              className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
            >
              <div className="font-semibold text-lg">{r.full_name}</div>
              <div className="text-xs text-gray-500">{r.email}</div>

              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  <b>Phone:</b> {r.phone || "—"}
                </div>
                <div>
                  <b>Business:</b> {r.business_type || "—"}
                </div>
                <div>
                  <b>Pages Needed:</b> {r.pages_needed || "—"}
                </div>
                <div>
                  <b>Submitted:</b> {formatDate(r.created_at)}
                </div>
              </div>

              <button
                className="text-xs border px-2 py-1 rounded mt-2"
                onClick={() => setViewItem(r)}
              >
                View Full Request
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {layout === "table" && (
        <AdminTable<PageRequest>
          columns={[
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "pages", label: "Pages Needed" },
            { key: "date", label: "Date" },
            { key: "actions", label: "Actions" },
          ]}
          rows={filteredRows}
          rowKey={(r) => r.id}
          renderCell={(r, key) => {
            switch (key) {
              case "name":
                return <span className="font-medium">{r.full_name}</span>;

              case "phone":
                return r.phone || "—";

              case "pages":
                return r.pages_needed || "—";

              case "date":
                return formatDate(r.created_at);

              case "actions":
                return (
                  <button
                    className="border rounded px-2 py-1 text-xs"
                    onClick={() => setViewItem(r)}
                  >
                    View
                  </button>
                );
            }
          }}
        />
      )}

      {/* VIEW MODAL */}
      {viewItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4"
          onClick={() => setViewItem(null)}
        >
          <div
            className="bg-white rounded max-w-2xl w-full max-h-[80vh] flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Page Request Details</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              <p>
                <b>Name:</b> {viewItem.full_name}
              </p>
              <p>
                <b>Email:</b> {viewItem.email}
              </p>
              <p>
                <b>Phone:</b> {viewItem.phone}
              </p>

              <hr />

              <p>
                <b>Business Type:</b> {viewItem.business_type || "—"}
              </p>
              <p>
                <b>Pages Needed:</b> {viewItem.pages_needed || "—"}
              </p>

              <hr />

              <p>
                <b>Street:</b> {viewItem.street_address || "—"}
              </p>
              <p>
                <b>City:</b> {viewItem.city || "—"}
              </p>
              <p>
                <b>State:</b> {viewItem.state || "—"}
              </p>
              <p>
                <b>Zip:</b> {viewItem.zip || "—"}
              </p>

              <hr />

              <p>
                <b>Status:</b> {viewItem.status || "new"}
              </p>
              <p>
                <b>Submitted:</b> {formatDate(viewItem.created_at)}
              </p>
            </div>

            <div className="p-4 border-t">
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
    </div>
  );
}
