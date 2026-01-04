"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type LeadRow = {
  id: string;
  lead_id: string;
  submission_type?: string;
  partner_id?: string;

  first_name?: string;
  last_name?: string;

  lead_status?: string;
  project_details?: string;
  created_at?: string;
};

/* ===============================
   HELPERS
================================ */
function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function leadTypeLabel(t?: string) {
  switch (t) {
    case "general":
      return "General Inquiry";
    case "quote":
      return "Swing / Door Quote";
    case "partner_tracking":
      return "Partner Tracking";
    default:
      return "—";
  }
}

/* ===============================
   PAGE
================================ */
export default function PartnerLeadsPage() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* LOAD PARTNER ID */
  useEffect(() => {
    async function loadPartnerId() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("partners")
        .select("partner_id")
        .eq("email_address", user.email)
        .single();

      if (!data?.partner_id) {
        setLoading(false);
        return;
      }

      setPartnerId(data.partner_id);
    }

    loadPartnerId();
  }, []);

  /* LOAD LEADS */
  useEffect(() => {
    if (!partnerId) return;

    async function loadLeads() {
      setLoading(true);

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("partner_id", partnerId)
        .neq("submission_type", "partner_order")
        .order("created_at", { ascending: false });

      setRows(data || []);
      setLoading(false);
    }

    loadLeads();
  }, [partnerId]);

  if (loading) return <div className="p-6">Loading…</div>;

  if (!partnerId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-700">
          Partner Access Pending
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">My Leads</h1>
        <p className="text-sm text-gray-500">
          View leads assigned to you and their current status
        </p>
      </div>

      {/* LEADS */}
      <div className="space-y-4">
        {rows.length === 0 && (
          <div className="border rounded p-6 text-center text-gray-500">
            No leads yet.
          </div>
        )}

        {rows.map((l) => (
          <div
            key={l.id}
            className="border rounded-lg p-4 space-y-3 bg-white"
          >
            {/* LEAD ID */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Lead #</span>
              <span className="font-mono">{l.lead_id}</span>
            </div>

            {/* CUSTOMER */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium">
                {l.first_name} {l.last_name}
              </span>
            </div>

            {/* LEAD TYPE */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">
                {leadTypeLabel(l.submission_type)}
              </span>
            </div>

            {/* DATE */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {formatDate(l.created_at)}
              </span>
            </div>

            {/* STATUS */}
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {l.lead_status
                  ? l.lead_status.replaceAll("_", " ")
                  : "new"}
              </span>
            </div>

            {/* NOTES / DETAILS */}
            {l.project_details && (
              <div className="pt-2 text-xs text-gray-500">
                <span className="font-medium">Details:</span>{" "}
                {l.project_details}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BACK */}
      <div className="pt-4 text-center">
        <a
          href="/partners/dashboard"
          className="inline-block px-4 py-2 border rounded text-sm"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
