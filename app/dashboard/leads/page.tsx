"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email_address: "",
    customer_phone: "",
    looking_for: "",
    lead_status: "new",
    partner_id: "",
  });

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setLeads(data);
  }

  function setField(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function addLead() {
    const leadId = `LD${Date.now()}`;

    const { error } = await supabase.from("leads").insert([
      {
        lead_id: leadId,
        first_name: form.first_name,
        last_name: form.last_name,
        email_address: form.email_address,
        customer_phone: form.customer_phone,
        looking_for: form.looking_for,
        lead_status: form.lead_status,
        partner_id: form.partner_id || null,
        source: "admin",
      },
    ]);

    if (!error) {
      setForm({
        first_name: "",
        last_name: "",
        email_address: "",
        customer_phone: "",
        looking_for: "",
        lead_status: "new",
        partner_id: "",
      });
      setShowAddForm(false);
      loadLeads();
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2>Leads</h2>

      {/* ADD LEAD TOGGLE */}
      <button
        style={btn}
        onClick={() => setShowAddForm(p => !p)}
      >
        {showAddForm ? "Close Add Lead" : "Add Lead"}
      </button>

      {/* ADD LEAD FORM */}
      {showAddForm && (
        <div style={box}>
          <input style={input} placeholder="First Name" value={form.first_name} onChange={e => setField("first_name", e.target.value)} />
          <input style={input} placeholder="Last Name" value={form.last_name} onChange={e => setField("last_name", e.target.value)} />
          <input style={input} placeholder="Email" value={form.email_address} onChange={e => setField("email_address", e.target.value)} />
          <input style={input} placeholder="Phone" value={form.customer_phone} onChange={e => setField("customer_phone", e.target.value)} />
          <input style={input} placeholder="What is this lead for?" value={form.looking_for} onChange={e => setField("looking_for", e.target.value)} />
          <input style={input} placeholder="Partner ID (optional)" value={form.partner_id} onChange={e => setField("partner_id", e.target.value)} />

          <select style={input} value={form.lead_status} onChange={e => setField("lead_status", e.target.value)}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quote_sent">Quote Sent</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <button style={btn} onClick={addLead}>Save Lead</button>
        </div>
      )}

      {/* LEADS LIST */}
      {leads.map(lead => {
        const open = expandedId === lead.id;

        return (
          <div key={lead.id} style={box}>
            <strong>Lead ID:</strong> {lead.lead_id}<br />
            <strong>Name:</strong> {lead.first_name} {lead.last_name}<br />
            <strong>Status:</strong> {lead.lead_status}<br />

            <button
              style={{ ...btn, marginTop: 10 }}
              onClick={() => setExpandedId(open ? null : lead.id)}
            >
              {open ? "Hide Details" : "View More"}
            </button>

            {open && (
              <div style={{ marginTop: 12 }}>
                <div><b>Email:</b> {lead.email_address || "—"}</div>
                <div><b>Phone:</b> {lead.customer_phone || "—"}</div>
                <div><b>Looking For:</b> {lead.looking_for || "—"}</div>
                <div><b>Partner ID:</b> {lead.partner_id || "—"}</div>
                <div><b>Source:</b> {lead.source}</div>
                <div><b>Created:</b> {new Date(lead.created_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const btn = {
  background: "#007bff",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 6,
  cursor: "pointer",
  border: "none",
};

const box = {
  border: "1px solid #ccc",
  padding: 16,
  borderRadius: 8,
  marginTop: 20,
};
