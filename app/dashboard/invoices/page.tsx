"use client";

import { useEffect, useMemo, useState } from "react";
import AdminTable from "../../components/ui/admintable";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
/* ===============================
   TYPES
================================ */
type LineItem = {
  name?: string;
  description?: string;
  quantity?: number;
  total?: number;
};

type Invoice = {
  invoiceid: number;
  invoice_number?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;

  currency_code: string;
  amount: string;
  paid_amount?: string;
  outstanding_amount?: string;

  issued_at?: string;
  due_date?: string;

  notes?: string;
  pdf_url?: string;
};

/* ===============================
   PAGE
================================ */
export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [layout, setLayout] = useState<"cards" | "table">("cards");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [viewItem, setViewItem] = useState<Invoice | null>(null);
  const searchParams = useSearchParams();
const highlightId = searchParams.get("id");

  // 🔥 NEW STATE FOR LINE ITEMS
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const PAGE_SIZE = 25;

  /* 🔥 LOAD FROM SUPABASE (FAST) */
  async function loadInvoices(reset = false) {
    setLoading(true);

    const start = reset ? 0 : offset;

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("issued_at", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);

    if (!error && data) {
      if (reset) {
        setRows(data);
        setOffset(PAGE_SIZE);
      } else {
        setRows((prev) => [...prev, ...data]);
        setOffset((prev) => prev + PAGE_SIZE);
      }
    }

    setLoading(false);
  }

  /* 🔥 INITIAL LOAD */
  useEffect(() => {
    loadInvoices(true);
  }, [sort]);

useEffect(() => {
  if (!highlightId || !rows.length) return;

  const found = rows.find(
    (i) => String(i.invoiceid) === String(highlightId)
  );

  if (found) {
    setViewItem(found); // 🔥 AUTO OPENS INVOICE

    // 🔥 ALSO LOAD LINE ITEMS (IMPORTANT)
    supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", found.invoiceid)
      .then(({ data }) => {
        setLineItems(data || []);
      });
  }
}, [highlightId, rows]);


  /* 🔥 SCROLL LOAD */
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        loadInvoices();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [offset]);

  /* 🔥 FILTER + SORT */
  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        `${i.invoice_number} ${i.customer_name} ${i.customer_email}`
          .toLowerCase()
          .includes(q)
      );
    }

    list.sort((a, b) => {
      const da = new Date(a.issued_at || "").getTime();
      const db = new Date(b.issued_at || "").getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return list;
  }, [rows, search, sort]);

  if (loading && rows.length === 0)
    return <div className="p-6">Loading invoices…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-375 w-full mx-auto">

      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Invoices</h1>
          <span className="text-sm text-gray-600">
            Total Loaded: {filteredRows.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Doorplace USA — Accounting
        </p>
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
        <div className="flex gap-2 flex-wrap">

          {/* SYNC BUTTON */}
          <button
            onClick={() => fetch("/api/freshbooks/invoices")}
            className="bg-black text-white px-3 py-2 rounded"
          >
            Sync
          </button>

          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search invoice #, customer, email"
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
          </select>
        </div>
      </div>

      
      {/* ===============================
    CARDS LAYOUT (NEW)
================================ */}
{layout === "cards" && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

    {filteredRows.map((i) => (
      <div
        key={i.invoiceid}
        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-lg">
              {i.customer_name || "No Name"}
            </div>
            <div className="text-xs text-gray-500">
              {i.customer_email || "—"}
            </div>
          </div>

          {/* STATUS */}
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              i.outstanding_amount && Number(i.outstanding_amount) > 0
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {i.outstanding_amount && Number(i.outstanding_amount) > 0
              ? "Unpaid"
              : "Paid"}
          </span>
        </div>

        {/* DETAILS */}
        <div className="text-xs text-gray-600 space-y-1">

          <div>
            <b>Invoice:</b> #{i.invoice_number || i.invoiceid}
          </div>

          <div>
            <b>Date:</b>{" "}
            {i.issued_at
              ? new Date(i.issued_at).toLocaleDateString()
              : "—"}
          </div>

          <div>
            <b>Total:</b> {i.currency_code}{" "}
            {Number(i.amount).toFixed(2)}
          </div>

          <div>
            <b>Balance:</b> {i.currency_code}{" "}
            {Number(i.outstanding_amount || 0).toFixed(2)}
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2">

          <button
            className="text-xs border px-2 py-1 rounded"
            onClick={async () => {
              setViewItem(i);

              const { data } = await supabase
                .from("invoice_line_items")
                .select("*")
                .eq("invoice_id", i.invoiceid);

              setLineItems(data || []);

              fetch("/api/sync/freshbooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId: i.invoiceid }),
              })
                .then((res) => res.json())
                .then(async () => {
                  const { data: updated } = await supabase
                    .from("invoice_line_items")
                    .select("*")
                    .eq("invoice_id", i.invoiceid);

                  setLineItems(updated || []);
                });
            }}
          >
            View
          </button>

          <button
            className="text-xs border px-2 py-1 rounded"
            onClick={() => {
              if (i.pdf_url) window.open(i.pdf_url, "_blank");
            }}
          >
            PDF
          </button>

          <button
            className="text-xs border px-2 py-1 rounded"
            onClick={() => {
              fetch("/api/sync/freshbooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId: i.invoiceid }),
              });
            }}
          >
            Sync
          </button>

        </div>
      </div>
    ))}

  </div>
)}

{/* ===============================
    TABLE (YOUR ORIGINAL)
================================ */}
{layout === "table" && (
  <AdminTable<Invoice>
    columns={[
      { key: "invoice", label: "Invoice" },
      { key: "amount", label: "Amount" },
      { key: "actions", label: "Actions" },
    ]}
    rows={filteredRows}
    rowKey={(i) => String(i.invoiceid)}
    renderCell={(i, key) => {
      switch (key) {
        case "invoice":
          return (
            <div>
              <div className="font-medium">
                #{i.invoice_number || i.invoiceid}
              </div>
              <div className="text-xs text-gray-500">
                {i.customer_name || "—"}
              </div>
            </div>
          );

        case "amount":
          return (
            <div className="text-right font-medium">
              {i.currency_code} {Number(i.amount).toFixed(2)}
            </div>
          );

        case "actions":
          return (
            <select
              className="border rounded px-2 py-1 text-xs w-full max-w-35"
              onChange={async (e) => {
                const v = e.target.value;
                e.target.value = "";

                if (v === "view") {
                  setViewItem(i);

                  const { data } = await supabase
                    .from("invoice_line_items")
                    .select("*")
                    .eq("invoice_id", i.invoiceid);

                  setLineItems(data || []);

                  fetch("/api/sync/freshbooks", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ invoiceId: i.invoiceid }),
                  })
                    .then((res) => res.json())
                    .then(async () => {
                      const { data: updated } = await supabase
                        .from("invoice_line_items")
                        .select("*")
                        .eq("invoice_id", i.invoiceid);

                      setLineItems(updated || []);
                    });
                }

                if (v === "pdf" && i.pdf_url) {
                  window.open(i.pdf_url, "_blank");
                }
              }}
            >
              <option value="">Select</option>
              <option value="view">View</option>
              <option value="pdf">Open PDF</option>
            </select>
          );
      }
    }}
  />
)}

      {/* LOADING MORE */}
      {loading && rows.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Loading more invoices...
        </div>
      )}

      {/* MODAL */}
      {viewItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4"
          onClick={() => setViewItem(null)}
        >
          <div
            className="bg-white rounded max-w-4xl w-full max-h-[75vh] flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Invoice Details</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">

              <div><b>Invoice #:</b> {viewItem.invoice_number}</div>
              <div><b>Customer:</b> {viewItem.customer_name}</div>
              <div><b>Email:</b> {viewItem.customer_email || "—"}</div>
              <div><b>Phone:</b> {viewItem.customer_phone || "—"}</div>

              <div>
                <b>Address:</b>{" "}
                {[viewItem.street, viewItem.city, viewItem.province, viewItem.postal_code]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>

              <hr />

              <div>
                <b>Line Items</b>
                <div className="mt-2 space-y-2">
                  {lineItems.length ? (
                    lineItems.map((l, idx) => (
                      <div key={idx} className="border rounded p-2">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-gray-600">{l.description}</div>
                        <div className="text-xs">
                          Qty: {l.quantity} — {viewItem.currency_code}{" "}
                          {Number(l.total || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No line items</div>
                  )}
                </div>
              </div>

              <hr />

              <div><b>Total:</b> {viewItem.currency_code} {Number(viewItem.amount).toFixed(2)}</div>
              <div><b>Paid:</b> {viewItem.currency_code} {Number(viewItem.paid_amount || 0).toFixed(2)}</div>
              <div><b>Balance:</b> {viewItem.currency_code} {Number(viewItem.outstanding_amount || 0).toFixed(2)}</div>

              <div>
                <b>Notes:</b>
                <div className="whitespace-pre-wrap">{viewItem.notes || "—"}</div>
              </div>
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