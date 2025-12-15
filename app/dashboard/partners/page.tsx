"use client";

import { useEffect, useState } from "react";
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

  async function loadPartners() {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setPartners(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPartners();
  }, []);

  async function runAction(
    action: "regenerate_partner_id" | "mark_email_sent" | "delete_partner",
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
    loadPartners(); // 🔑 THIS IS WHAT WAS MISSING
  }

  if (loading) return <div className="p-6">Loading partners…</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-red-700 mb-2">Partners</h1>
      <p className="text-sm text-gray-500 mb-6">
        Doorplace USA — Partner Control Panel
      </p>

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Partner ID</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-3">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-4 py-3">{p.email_address}</td>
                <td className="px-4 py-3">{p.cell_phone_number}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {p.partner_id}
                </td>
                <td className="px-4 py-3 flex gap-2">
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
                    className="px-3 py-1 text-xs rounded bg-black text-white"
                    onClick={() =>
                      runAction("delete_partner", p)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
