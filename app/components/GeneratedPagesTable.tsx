"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  slug: string;
  page_template: string;
  status: string;
  created_at: string;
};

const TEMPLATE_LABELS: Record<string, string> = {
  porch_swing_city: "Porch Swing – City",
  porch_swing_delivery: "Porch Swing – Delivery",
  porch_swing_installation_city: "Porch Swing – Installation",
  porch_swing_size_city: "Porch Swing – Size",
  porch_swing_material_city: "Porch Swing – Material",
  porch_swing_style_city: "Porch Swing – Style",
  porch_swing_usecase_city: "Porch Swing – Use Case",
  door_city: "Door Style – City",
  custom_door_installation_city: "Custom Door Installation",
};

export default function GeneratedPagesTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/pages/generated-pages?q=${encodeURIComponent(search)}`
    );
    const json = await res.json();
    setRows(json.rows || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [search]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(rows.map((r) => r.id)));
  };

  const clear = () => setSelected(new Set());

  const remove = async (ids: string[]) => {
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} page(s)?`)) return;

    await fetch("/api/pages/generated-pages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    clear();
    load();
  };

  return (
    <div className="mt-12 rounded-xl border bg-white">
      <div className="p-4 flex gap-2 items-center">
        <h2 className="text-lg font-semibold flex-1">
          Generated Pages
        </h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search slug or URL…"
          className="border rounded px-3 py-1 text-sm"
        />

        <button
          onClick={() => remove(Array.from(selected))}
          disabled={!selected.size}
          className="px-3 py-1 text-sm rounded bg-red-600 text-white disabled:opacity-50"
        >
          Delete Selected ({selected.size})
        </button>
      </div>

      <div className="max-h-105 overflow-auto border-t">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b z-10">
            <tr>
              <th className="p-2 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === rows.length && rows.length > 0}
                  onChange={() =>
                    selected.size === rows.length ? clear() : selectAll()
                  }
                />
              </th>
              <th className="p-2 text-left">URL</th>
              <th className="p-2">Template</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2 w-16">Delete</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>

                <td className="p-2 font-mono text-xs">
                  {r.slug}
                </td>

                <td className="p-2">
                  {TEMPLATE_LABELS[r.page_template] || r.page_template}
                </td>

                <td className="p-2">
                  <span
                    className={[
                      "px-2 py-0.5 rounded text-xs font-semibold",
                      r.status === "generated" &&
                        "bg-yellow-100 text-yellow-800",
                      r.status === "published" &&
                        "bg-green-100 text-green-800",
                      r.status === "failed" &&
                        "bg-red-100 text-red-800",
                    ].join(" ")}
                  >
                    {r.status}
                  </span>
                </td>

                <td className="p-2">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>

                <td className="p-2">
                  <button
                    onClick={() => remove([r.id])}
                    className="text-red-600 underline"
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}

            {!rows.length && !loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No generated pages found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
