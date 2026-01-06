// app/dashboard/partners/page.tsx
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
  tracking_link: string;

  status: "pending" | "active";
  email_verified: boolean;
  welcome_email_sent: boolean;
  confirmation_email_recent?: boolean;
  agreed_to_partner_terms?: boolean;

  created_at: string;

  business_name?: string;
  coverage_area?: string;
  preferred_contact_method?: string;
  sales_experience?: string;

  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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

export default function PartnersPage() {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Partner | null>(null);
  const [editItem, setEditItem] = useState<Partner | null>(null);
  const [layout, setLayout] = useState<"cards" | "table">("cards");
  



  const [sort, setSort] = useState<
    | "newest"
    | "oldest"
    | "name"
    | "login_users"
    | "no_login"
    | "email_not_verified"
    | "ready_for_activation"
    | "welcome_email_not_sent_login"
    | "pending"
    | "active"
  >("newest");






  async function loadRows() {
    setLoading(true);

    let query = supabase.from("partners").select("*");

    if (sort === "oldest") query = query.order("created_at", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    if (sort === "login_users") query = query.not("auth_user_id", "is", null);
    if (sort === "no_login") query = query.is("auth_user_id", null);
    if (sort === "email_not_verified") query = query.eq("email_verified", false);
    if (sort === "pending") query = query.eq("status", "pending");
    if (sort === "active") query = query.eq("status", "active");

    if (sort === "ready_for_activation") {
      query = query
        .not("auth_user_id", "is", null)
        .eq("email_verified", true)
        .eq("status", "pending");
    }

    if (sort === "welcome_email_not_sent_login") {
      query = query
        .not("auth_user_id", "is", null)
        .eq("status", "pending")
        .eq("welcome_email_sent", false);
    }

    const { data } = await query;
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
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
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        )
      );
    }

    return list;
  }, [rows, search, sort]);

  async function runAction(
    action:
      | "regenerate_partner_id"
      | "send_welcome_email"
      | "send_confirmation_email"
      | "delete_partner",
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

  async function updatePartnerStatus(
    partnerId: string,
    status: "active" | "pending"
  ) {
    await supabase.from("partners").update({ status }).eq("id", partnerId);
    loadRows();
  }

  if (loading) return <div className="p-6">Loading partners…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-6 pb-6 space-y-4">
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-700">Partners</h1>
          <span className="text-sm text-gray-600">Total: {filteredRows.length}</span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Doorplace USA — Partner Control Panel
        </p>
<div className="flex items-center gap-2">
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
            <option value="login_users">Login Users</option>
            <option value="no_login">No Login Yet</option>
            <option value="email_not_verified">Email Not Verified</option>
            <option value="ready_for_activation">Ready for Activation</option>
            <option value="welcome_email_not_sent_login">Welcome Email Not Sent</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>


{layout === "cards" && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {filteredRows.map((p) => (
      <div
        key={p.id}
        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-lg">
              {p.first_name} {p.last_name}
            </div>
            <div className="text-xs text-gray-500">
              {p.email_address}
            </div>
          </div>

          <select
            className={`text-xs font-semibold border rounded px-2 py-1 ${
              p.status === "active"
                ? "text-green-700"
                : "text-orange-700"
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
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <div><b>Partner ID:</b> {p.partner_id}</div>
          <div><b>Joined:</b> {formatDate(p.created_at)}</div>
          <div><b>Email Verified:</b> {p.email_verified ? "Yes" : "No"}</div>
          <div><b>Welcome Email:</b> {p.welcome_email_sent ? "Sent" : "Not Sent"}</div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="text-xs border px-2 py-1 rounded"
            onClick={() => setViewItem(p)}
          >
            View
          </button>

          <button
            className="text-xs border px-2 py-1 rounded"
            onClick={() => setEditItem(p)}
          >
            Edit
          </button>

          <select
            className="text-xs border px-2 py-1 rounded flex-1"
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (v === "welcome") runAction("send_welcome_email", p);
              if (v === "confirm") runAction("send_confirmation_email", p);
              if (v === "regen") runAction("regenerate_partner_id", p);
              if (v === "delete") runAction("delete_partner", p);
            }}
          >
            <option value="">Actions</option>
            <option value="welcome">Send Welcome Email</option>
            <option value="confirm">Send Confirmation Email</option>
            <option value="regen">Regenerate ID</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>
    ))}
  </div>
)}


{layout === "table" && (
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
                  : "text-orange-700"
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
                if (v === "confirm") runAction("send_confirmation_email", p);
                if (v === "regen") runAction("regenerate_partner_id", p);
                if (v === "delete") runAction("delete_partner", p);
              }}
            >
              <option value="">Select</option>
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="welcome">Send Welcome Email</option>
              <option value="confirm">Send Confirmation Email</option>
              <option value="regen">Regenerate ID</option>
              <option value="delete">Delete</option>
            </select>
          );
      }
    }}
  />
)}




      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded max-w-2xl w-full max-h-[77vh] flex flex-col shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Partner Profile</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Basic Information</h3>
                <p><b>Name:</b> {viewItem.first_name} {viewItem.last_name}</p>
                <p><b>Email:</b> {viewItem.email_address}</p>
                <p><b>Phone:</b> {viewItem.cell_phone_number}</p>
                <p><b>Partner ID:</b> {viewItem.partner_id}</p>
                <p><b>Joined Date:</b> {formatDate(viewItem.created_at)}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Business Information</h3>
                <p><b>Business Name:</b> {viewItem.business_name || "—"}</p>
                <p><b>Coverage Area:</b> {viewItem.coverage_area || "—"}</p>
                <p><b>Preferred Contact:</b> {viewItem.preferred_contact_method || "—"}</p>
                <p><b>Sales Experience:</b> {viewItem.sales_experience || "—"}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Address</h3>
                <p><b>Street:</b> {viewItem.street_address || "—"}</p>
                <p><b>City:</b> {viewItem.city || "—"}</p>
                <p><b>State:</b> {viewItem.state || "—"}</p>
                <p><b>Zip:</b> {viewItem.zip_code || "—"}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">System Status</h3>
                <p><b>Status:</b> {viewItem.status}</p>
                <p><b>Email Verified:</b> {viewItem.email_verified ? "Yes" : "No"}</p>
                <p><b>Welcome Email Sent:</b> {viewItem.welcome_email_sent ? "Yes" : "No"}</p>
                <p><b>Recent Confirmation:</b> {viewItem.confirmation_email_recent ? "Yes" : "No"}</p>
                <p><b>Terms Accepted:</b> {viewItem.agreed_to_partner_terms ? "Yes" : "No"}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Tracking Link</h3>
                <input readOnly value={viewItem.tracking_link} className="w-full border px-2 py-1 rounded text-sm bg-gray-50" />
              </div>
            </div>

            <div className="p-4 border-t">
              <button className="bg-black text-white px-4 py-2 rounded w-full" onClick={() => setViewItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)}>
          <div className="bg-white p-6 rounded max-w-2xl w-full max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Partner</h2>

            {[
              ["First Name", "first_name"],
              ["Last Name", "last_name"],
              ["Email", "email_address"],
              ["Phone", "cell_phone_number"],
              ["Business Name", "business_name"],
              ["Coverage Area", "coverage_area"],
              ["Preferred Contact", "preferred_contact_method"],
              ["Sales Experience", "sales_experience"],
              ["Street Address", "street_address"],
              ["City", "city"],
              ["State", "state"],
              ["Zip Code", "zip_code"],
            ].map(([label, key]) => (
              <input
                key={key}
                className="border w-full mb-2 px-3 py-2"
                placeholder={label}
                value={(editItem as any)[key] || ""}
                onChange={(e) =>
                  setEditItem({ ...editItem, [key]: e.target.value })
                }
              />
            ))}

            <div className="flex gap-2 mt-4">
              <button
                className="bg-red-700 text-white px-4 py-2 rounded flex-1"
                onClick={async () => {
                  await supabase.from("partners").update(editItem).eq("id", editItem.id);
                  setEditItem(null);
                  loadRows();
                }}
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
