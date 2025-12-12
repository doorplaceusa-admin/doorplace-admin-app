"use client";

import { useState, useEffect } from "react";
import { createClientHelper } from "@/lib/supabaseClient";

type Company = {
  id: string;
  name: string;
  status: string | null;
  owner_id: string;
  owner_email: string | null;
  created_at: string | null;
};

export default function CompaniesPage() {
  const supabase = createClientHelper();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newName, setNewName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCompanies() {
    setLoading(true);
    setErrorMessage(null);

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      setErrorMessage("Not logged in.");
      setLoading(false);
      return;
    }

    const user = authData.user;

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setCompanies([]);
    } else {
      setCompanies((data || []) as Company[]);
    }

    setLoading(false);
  }

  async function addCompany() {
    if (!newName.trim()) {
      alert("Company name is required.");
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      alert("Not logged in.");
      return;
    }

    const user = authData.user;

    const { error } = await supabase.from("companies").insert([
      {
        name: newName.trim(),
        owner_id: user.id,
        owner_email: user.email,
        status: "active",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setNewName("");
    loadCompanies();
  }

  async function deleteCompany(id: string) {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Companies</h1>
      <p className="text-gray-600 mt-2">
        Manage all your companies here.
      </p>

      {errorMessage && (
        <p className="text-red-600 mt-4">{errorMessage}</p>
      )}

      {/* Add Company */}
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
          className="px-4 py-2 rounded text-white"
          style={{ backgroundColor: "#b80d0d" }}
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
                className="p-4 border rounded flex justify-between items-center bg-white"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500">
                    Status: {c.status || "unknown"}
                  </p>
                </div>

                <button
                  onClick={() => deleteCompany(c.id)}
                  className="px-3 py-1 rounded text-white"
                  style={{ backgroundColor: "#b80d0d" }}
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
