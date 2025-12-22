"use client";

import { useState } from "react";

type TestRow = {
  id: number;
  name: string;
  status: string;
};

const TEST_DATA: TestRow[] = [
  { id: 1, name: "Alexander Hamilton", status: "Active" },
  { id: 2, name: "Elizabeth Schuyler", status: "Pending" },
  { id: 3, name: "George Washington", status: "Approved" },
  { id: 4, name: "Thomas Jefferson With A Very Long Name", status: "Inactive" },
];

export default function TestPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = TEST_DATA.filter((r) =>
    r.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-64px)] max-w-full overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b pb-4">
        <h1 className="text-3xl font-bold text-red-700">Test Page</h1>
        <p className="text-sm text-gray-500">Temporary layout + table test</p>

        {/* CONTROLS */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <input
            className="border rounded px-3 py-2 w-full md:max-w-sm"
            placeholder="Search name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 w-full md:w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded overflow-hidden">
        {filtered.map((row) => (
          <div
            key={row.id}
            className="flex justify-between items-center border-b last:border-b-0 px-3 py-2"
          >
            {/* NAME */}
            <div className="flex flex-col max-w-[200px] truncate">
              <span className="font-medium truncate">{row.name}</span>
              <span className="text-xs text-gray-500 truncate">
                ID #{row.id}
              </span>
            </div>

            {/* STATUS */}
            <span className="text-xs font-semibold text-green-700">
              ● {row.status}
            </span>

            {/* ACTION */}
            <select className="border rounded px-2 py-1 text-xs">
              <option value="">Select</option>
              <option>View</option>
              <option>Edit</option>
              <option>Delete</option>
            </select>
          </div>
        ))}
      </div>

    </div>
  );
}
