"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  const [viewPartner, setViewPartner] = useState<Partner | null>(null);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);

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

  async function runAction(
    action:
      | "regenerate_partner_id"
      | "mark_email_sent"
      | "delete_partner"
      | "sync_shopify_tags",
    partner: Partner
  ) {
    if (
      !confirm(
        `Run ${action.replaceAll("_", " ")} for ${partner.email_address}?`
      )
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
    if (!res.ok) return alert(json.error || "Action failed");

    loadPartners();
  }

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

  return (
    <div className="p-4 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white pb-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-700">Partners</h1>
          <span className="text-sm text-gray-600">
            Total: {filteredPartners.length}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Doorplace USA — Partner Control Panel
        </p>

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

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 hidden md:table-cell">Phone</th>
              <th className="px-3 py-2">Partner ID</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPartners.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-3 py-2 break-all">
                  {p.email_address}
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  {p.cell_phone_number}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {p.partner_id}
                </td>
                <td className="px-3 py-2">
                  {p.onboarding_email_sent ? (
                    <span className="text-green-700 text-xs font-bold">
                      Email Sent
                    </span>
                  ) : (
                    <span className="text-orange-600 text-xs font-bold">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      e.target.value = "";
                      if (val === "view") setViewPartner(p);
                      if (val === "edit") setEditPartner(p);
                      if (val === "regen") runAction("regenerate_partner_id", p);
                      if (val === "email") runAction("mark_email_sent", p);
                      if (val === "shopify") runAction("sync_shopify_tags", p);
                      if (val === "delete") runAction("delete_partner", p);
                    }}
                  >
                    <option value="">Select</option>
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                    <option value="regen">Regenerate ID</option>
                    <option value="email">Send Email</option>
                    <option value="shopify">Sync Shopify</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {viewPartner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 rounded w-full max-w-lg">
            <h2 className="text-xl font-bold mb-3">Partner Profile</h2>

            <div className="space-y-1 text-sm">
              <p><b>Name:</b> {viewPartner.first_name} {viewPartner.last_name}</p>
              <p><b>Email:</b> {viewPartner.email_address}</p>
              <p><b>Phone:</b> {viewPartner.cell_phone_number}</p>
              <p><b>Partner ID:</b> {viewPartner.partner_id}</p>
              <p className="break-all">
                <b>Tracking Link:</b><br />
                https://doorplaceusa.com/pages/swing-partner-lead?partner_id={viewPartner.partner_id}
              </p>
              <p>
                <b>Address:</b>{" "}
                {viewPartner.street_address}, {viewPartner.city},{" "}
                {viewPartner.state} {viewPartner.zip_code}
              </p>
              <p><b>Business Name:</b> {viewPartner.business_name}</p>
              <p><b>Coverage Area:</b> {viewPartner.coverage_area}</p>
              <p><b>Preferred Contact:</b> {viewPartner.preferred_contact_method}</p>
              <p><b>Sales Experience:</b> {viewPartner.sales_experience}</p>
            </div>

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
          <div className="bg-white p-5 rounded w-full max-w-lg">
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
                className="border w-full mb-2 px-3 py-2 text-sm"
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
                className="bg-red-600 text-white px-4 py-2 rounded w-full"
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded w-full"
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
