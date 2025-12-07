"use client";

import { useState, useEffect } from "react";
import { supabase }from "@/lib/supabaseClient";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [newName, setNewName] = useState("");

  // Fetch all companies owned by logged-in user
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setCompanies(data || []);

      setLoading(false);
    }

    loadCompanies();
  }, []);

  // Add a company
  async function addCompany() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return alert("Not logged in.");

    const { error } = await supabase.from("companies").insert([
      {
        name: newName,
        owner_id: user.id,
        owner_email: user.email,
        status: "active",
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      window.location.reload();
    }
  }

  // Delete company
  async function deleteCompany(id) {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) alert(error.message);
    else window.location.reload();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Companies</h1>
      <p className="text-gray-600 mt-2">Manage all your companies here.</p>

      {/* Add Company Form */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Add a Company</h2>

        <input
          type="text"
          placeholder="Company name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />

        <button
          onClick={addCompany}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Company
        </button>
      </div>

      {/* Company List */}
      <div className="mt-10">
        <h2 className="font-semibold mb-3">Your Companies</h2>

        {loading ? (
          <p>Loading...</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-500">No companies found.</p>
        ) : (
          <ul className="space-y-3">
            {companies.map((c) => (
              <li
                key={c.id}
                className="p-4 border rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500">
                    Status: {c.status || "unknown"}
                  </p>
                </div>

                <button
                  onClick={() => deleteCompany(c.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
