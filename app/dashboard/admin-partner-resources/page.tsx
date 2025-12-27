"use client";
import { useEffect, useMemo, useState } from "react";
type Resource = {
  id: string;
  title: string;
  description: string;
  resource_url: string;
  category: string;
  resource_type: string;
  is_active: boolean;
  show_new: boolean;
  sort_order: number;
  created_at?: string;
};
const emptyForm: Omit<Resource, "id"> = {
  title: "",
  description: "",
  resource_url: "",
  category: "General",
  resource_type: "link",
  is_active: true,
  show_new: false,
  sort_order: 100,
};
export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Resource, "id">>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Resource | null>(null);
  const fetchResources = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/partner-resources");
    const data = await res.json();
    setResources(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchResources();
  }, []);
  const categories = useMemo(() => {
    const set = new Set<string>();
    (resources || []).forEach((r) => r.category && set.add(r.category));
    return ["General", ...Array.from(set).filter((c) => c !== "General")];
  }, [resources]);
  async function createResource() {
    if (!form.title.trim()) return alert("Title required");
    if (!form.resource_url.trim()) return alert("Resource URL required");
    setSaving(true);
    const res = await fetch("/api/admin/partner-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text();
      alert(t || "Failed to create resource");
      return;
    }
    setForm(emptyForm);
    fetchResources();
  }
  async function saveEdit() {
    if (!editItem) return;
    if (!editItem.title.trim()) return alert("Title required");
    if (!editItem.resource_url.trim()) return alert("Resource URL required");
    setSaving(true);
    const res = await fetch("/api/admin/partner-resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editItem),
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text();
      alert(t || "Failed to update resource");
      return;
    }
    setEditItem(null);
    fetchResources();
  }
  async function deleteResource(id: string) {
    const ok = confirm("Delete this resource?");
    if (!ok) return;
    setSaving(true);
    const res = await fetch(`/api/admin/partner-resources?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text();
      alert(t || "Failed to delete resource");
      return;
    }
    fetchResources();
  }
  async function toggleActive(r: Resource) {
    const next = { ...r, is_active: !r.is_active };
    await fetch("/api/admin/partner-resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    fetchResources();
  }
  if (loading) return <div style={{ padding: 30 }}>Loading admin resources…</div>;
  return (
    <div style={{ padding: 30, maxWidth: 980 }}>
      <h1 style={{ fontSize: 28, marginBottom: 14 }}>Partner Resource Panel</h1>
      {/* ADD NEW */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
          marginBottom: 18,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Add New Resource</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />
          <Input
            label="Resource URL"
            value={form.resource_url}
            onChange={(v) => setForm({ ...form, resource_url: v })}
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            list="category-list"
          />
          <Select
            label="Type"
            value={form.resource_type}
            onChange={(v) => setForm({ ...form, resource_type: v })}
            options={[
              { label: "Link", value: "link" },
              { label: "PDF", value: "pdf" },
              { label: "Form", value: "form" },
              { label: "Video", value: "video" },
              { label: "Doc", value: "doc" },
            ]}
          />
          <Input
            label="Sort Order (lower = higher)"
            type="number"
            value={String(form.sort_order)}
            onChange={(v) => setForm({ ...form, sort_order: Number(v || 0) })}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.show_new}
                onChange={(e) => setForm({ ...form, show_new: e.target.checked })}
              />
              Show NEW badge
            </label>
          </div>
        </div>
        <datalist id="category-list">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            onClick={createResource}
            disabled={saving}
            style={btnStyle("#b80d0d")}
          >
            {saving ? "Saving…" : "Add Resource"}
          </button>
          <button
            onClick={() => setForm(emptyForm)}
            disabled={saving}
            style={btnStyle("#111")}
          >
            Reset
          </button>
          <button
            onClick={fetchResources}
            disabled={saving}
            style={btnOutline()}
          >
            Refresh
          </button>
        </div>
      </div>
      {/* LIST */}
      {resources.length === 0 && <p>No resources yet.</p>}
      {resources
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              background: r.is_active ? "#fff" : "#f5f5f5",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <strong style={{ fontSize: 16 }}>{r.title}</strong>
                  {r.show_new && (
                    <span
                      style={{
                        background: "#22c55e",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      NEW
                    </span>
                  )}
                  {!r.is_active && (
                    <span style={{ fontSize: 12, color: "#666" }}>(disabled)</span>
                  )}
                </div>
                {r.description ? <p style={{ marginTop: 6 }}>{r.description}</p> : null}
                <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                  {r.category} • {r.resource_type} • sort: {r.sort_order}
                </div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <a href={r.resource_url} target="_blank" rel="noreferrer">
                    Open resource
                  </a>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 160 }}>
                <button onClick={() => toggleActive(r)} style={btnStyle(r.is_active ? "#b80d0d" : "#22c55e")}>
                  {r.is_active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => setEditItem(r)} style={btnStyle("#111")}>
                  Edit
                </button>
                <button onClick={() => deleteResource(r.id)} style={btnOutline()}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      {/* EDIT MODAL */}
      {editItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 10, width: 900, maxWidth: "100%", padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Edit Resource</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input
                label="Title"
                value={editItem.title}
                onChange={(v) => setEditItem({ ...editItem, title: v })}
              />
              <Input
                label="Resource URL"
                value={editItem.resource_url}
                onChange={(v) => setEditItem({ ...editItem, resource_url: v })}
              />
              <Input
                label="Category"
                value={editItem.category}
                onChange={(v) => setEditItem({ ...editItem, category: v })}
                list="category-list"
              />
              <Select
                label="Type"
                value={editItem.resource_type}
                onChange={(v) => setEditItem({ ...editItem, resource_type: v })}
                options={[
                  { label: "Link", value: "link" },
                  { label: "PDF", value: "pdf" },
                  { label: "Form", value: "form" },
                  { label: "Video", value: "video" },
                  { label: "Doc", value: "doc" },
                ]}
              />
              <Input
                label="Sort Order"
                type="number"
                value={String(editItem.sort_order)}
                onChange={(v) => setEditItem({ ...editItem, sort_order: Number(v || 0) })}
              />
              <Input
                label="Description"
                value={editItem.description || ""}
                onChange={(v) => setEditItem({ ...editItem, description: v })}
              />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={!!editItem.is_active}
                    onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })}
                  />
                  Active
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={!!editItem.show_new}
                    onChange={(e) => setEditItem({ ...editItem, show_new: e.target.checked })}
                  />
                  Show NEW badge
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={saveEdit} disabled={saving} style={btnStyle("#b80d0d")}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditItem(null)} disabled={saving} style={btnStyle("#111")}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Input({
  label,
  value,
  onChange,
  type,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  list?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#444", marginBottom: 6 }}>
        {label}
      </div>
      <input
        type={type || "text"}
        value={value}
        list={list}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: "10px 10px",
          outline: "none",
        }}
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#444", marginBottom: 6 }}>
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: "10px 10px",
          outline: "none",
          background: "#fff",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function btnStyle(bg: string) {
  return {
    padding: "10px 12px",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 800 as const,
  };
}
function btnOutline() {
  return {
    padding: "10px 12px",
    background: "#fff",
    color: "#111",
    border: "1px solid #ddd",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 800 as const,
  };
}

