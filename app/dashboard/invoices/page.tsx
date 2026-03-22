"use client";

import { useEffect, useMemo, useState } from "react";
import AdminTable from "../../components/ui/admintable";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type LineItem = {
  name?: string;
  description?: string;
  qty?: number;
  total?: string;
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
  line_items?: LineItem[];
  pdf_url?: string;
};

/* ===============================
   PAGE
================================ */
export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [viewItem, setViewItem] = useState<Invoice | null>(null);

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

        <div className="flex gap-2 flex-wrap">

          {/* 🔥 SYNC BUTTON */}
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

      {/* TABLE */}
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
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (v === "view") setViewItem(i);
                    if (v === "pdf" && i.pdf_url)
                      window.open(i.pdf_url, "_blank");
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

      {/* 🔥 LOADING MORE */}
      {loading && rows.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Loading more invoices...
        </div>
      )}

      {/* MODAL (UNCHANGED BUT FIXED) */}
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
                  {viewItem.line_items?.length ? (
                    viewItem.line_items.map((l, idx) => (
                      <div key={idx} className="border rounded p-2">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-gray-600">{l.description}</div>
                        <div className="text-xs">
                          Qty: {l.qty} — {viewItem.currency_code}{" "}
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