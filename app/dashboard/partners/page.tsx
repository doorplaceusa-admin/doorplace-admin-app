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
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  async function loadPartners() {
    setLoading(true);

    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: sort === "oldest" });

    if (!error && data) setPartners(data);
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
    const confirmed = confirm(
      `Run ${action.replaceAll("_", " ")} for ${partner.email_address}?`
    );
    if (!confirmed) return;

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

    alert("Action completed");
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
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white pb-4 border-b">
        <h1 className="text-3xl font-bold text-red-700">Partners</h1>
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
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                Phone
              </th>
              <th className="px-4 py-3 text-left">Partner ID</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPartners.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.first_name} {p.last_name}
                </td>

                <td className="px-4 py-3 break-all">
                  {p.email_address}
                </td>

                <td className="px-4 py-3 hidden md:table-cell">
                  {p.cell_phone_number}
                </td>

                <td className="px-4 py-3 font-mono text-xs">
                  {p.partner_id}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="px-3 py-1 text-xs rounded bg-gray-200"
                      onClick={() =>
                        runAction("regenerate_partner_id", p)
                      }
                    >
                      Regenerate ID
                    </button>

                    <button
                      className="px-3 py-1 text-xs rounded bg-red-600 text-white"
                      onClick={() =>
                        runAction("mark_email_sent", p)
                      }
                    >
                      Send Email
                    </button>

                    <button
                      className="px-3 py-1 text-xs rounded bg-blue-600 text-white"
                      onClick={() =>
                        runAction("sync_shopify_tags", p)
                      }
                    >
                      Sync Shopify
                    </button>

                    <button
                      className="px-3 py-1 text-xs rounded bg-black text-white"
                      onClick={() =>
                        runAction("delete_partner", p)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredPartners.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No partners found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
