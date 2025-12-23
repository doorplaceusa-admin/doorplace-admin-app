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
    <div className="w-full max-w-full overflow-hidden rounded border bg-white">
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`text-left text-xs font-semibold text-gray-600 px-3 py-2 border-b ${c.headerClassName || ""}`}
              >
                <div className="min-w-0 truncate">{c.label}</div>
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
                  className={`px-3 py-3 align-top text-sm ${c.cellClassName || ""}`}
                >
                  <div className="min-w-0 break-words overflow-hidden">
                    {renderCell(r, c.key)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
