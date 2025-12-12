"use client";

import { useState, useEffect } from "react";
import { createClientHelper } from "@/lib/supabaseClient";


export default function LeadsPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [leadType, setLeadType] = useState("");
  const [leadStatus, setLeadStatus] = useState("new");
  const [partnerId, setPartnerId] = useState("");
  const [companyId, setCompanyId] = useState("");

  const [leads, setLeads] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadLeads();
    loadCompany();
  }, []);

  async function loadCompany() {
    const supabase = createClientHelper();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.company_id) {
      setCompanyId(user.user_metadata.company_id);
    }
  }

  async function loadLeads() {
    const supabase = createClientHelper();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setLeads(data || []);
  }

  async function saveLead() {
    if (!partnerId.trim()) {
      alert("Partner ID is required.");
      return;
    }
    const supabase = createClientHelper();

    const payload = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      lead_source: leadSource,
      lead_type: leadType,
      status: leadStatus,
      partner_id: partnerId,
      company_id: companyId
    };

    let result;
    if (editingId) {
      result = await supabase.from("leads").update(payload).eq("id", editingId);
    } else {
      result = await supabase.from("leads").insert([payload]);
    }

    if (result.error) {
      alert(result.error.message);
    } else {
      resetForm();
      loadLeads();
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    const supabase = createClientHelper();
    await supabase.from("leads").delete().eq("id", id);
    loadLeads();
  }

  function startEdit(lead: any) {
    setEditingId(lead.id);
    setCustomerName(lead.customer_name);
    setCustomerEmail(lead.customer_email);
    setCustomerPhone(lead.customer_phone);
    setLeadSource(lead.lead_source);
    setLeadType(lead.lead_type);
    setLeadStatus(lead.status);
    setPartnerId(lead.partner_id);
  }

  function resetForm() {
    setEditingId(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setLeadSource("");
    setLeadType("");
    setLeadStatus("new");
    setPartnerId("");
  }

  const filteredLeads = leads.filter(l =>
    (l.customer_name || "").toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter ? l.status === statusFilter : true)
  );

  return (
    <div style={{ maxWidth: 1000 }}>
      <h2>Leads</h2>

      {/* === FORM BOX === */}
      <div style={box}>
        <h3>{editingId ? "Edit Lead" : "Add New Lead"}</h3>

        <input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} style={input} />
        <input placeholder="Customer Email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={input} />
        <input placeholder="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={input} />
        <input placeholder="Lead Source" value={leadSource} onChange={e => setLeadSource(e.target.value)} style={input} />
        <input placeholder="What is this lead for? (Door, Swing, Repair, etc.)" value={leadType} onChange={e => setLeadType(e.target.value)} style={input} />
        <input placeholder="Partner ID" value={partnerId} onChange={e => setPartnerId(e.target.value)} style={input} />

        <select value={leadStatus} onChange={e => setLeadStatus(e.target.value)} style={input}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="quote_sent">Quote Sent</option>
          <option value="scheduled">Scheduled</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <button onClick={saveLead} style={btn}>{editingId ? "Update Lead" : "Add Lead"}</button>
        {editingId && <button onClick={resetForm} style={{ ...btn, background: "#666" }}>Cancel</button>}
      </div>

      {/* === SEARCH + FILTER === */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} style={input} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={input}>
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="quote_sent">Quote Sent</option>
          <option value="scheduled">Scheduled</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* === LEAD LIST === */}
      {filteredLeads.map(lead => (
        <div key={lead.id} style={box}>
          <strong>{lead.customer_name}</strong><br />
          {lead.customer_email} | {lead.customer_phone}<br />
          <b>For:</b> {lead.lead_type || "Not specified"}<br />
          <b>Status:</b> {lead.status} | <b>Partner:</b> {lead.partner_id}

          <div style={{ marginTop: 10 }}>
            <button onClick={() => startEdit(lead)} style={btn}>Edit</button>
            <button onClick={() => deleteLead(lead.id)} style={{ ...btn, background: "#c0392b" }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const btn = {
  background: "#007bff",
  color: "#fff",
  padding: "8px 14px",
  marginRight: 10,
  borderRadius: 6,
  cursor: "pointer"
};

const box = {
  border: "1px solid #ccc",
  padding: 20,
  borderRadius: 8,
  marginBottom: 25
};
