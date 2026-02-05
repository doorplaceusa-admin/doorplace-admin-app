// app/components/ui/admintable.tsx
"use client";

import React from "react";

type Column = {
  key: string;
  label: string;
  headerClassName?: string;
  cellClassName?: string;
};

export type AdminTableProps<T> = {
  columns: Column[];
  rows: T[];
  rowKey: (row: T) => string;
  renderCell: (row: T, key: string) => React.ReactNode;
};

export default function AdminTable<T>({
  columns,
  rows,
  rowKey,
  renderCell,
}: AdminTableProps<T>) {
  return (
    /* ✅ Scroll container */
    <div className="w-full flex-1 min-h-0 overflow-auto rounded border bg-white">
      
      {/* ✅ Horizontal scroll support on mobile */}
      <div className="min-w-[700px]">

        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-left text-xs font-semibold text-gray-600 px-3 py-2 border-b ${
                    c.headerClassName || ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className="border-b last:border-b-0">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-3 align-top text-sm ${
                      c.cellClassName || ""
                    }`}
                  >
                    {renderCell(r, c.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
