"use client";

import React from "react";

type Column = {
  key: string;
  label: string;
  className?: string; // optional per-column styling (like hidden md:table-cell)
};

type AdminTableProps<T> = {
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
    <div className="bg-white border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-3 text-left ${c.className || ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 ${c.className || ""}`}>
                  {renderCell(row, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
