"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GlobalCompaniesGuard from "@/app/components/GlobalCompaniesGuard";
import CompanySwitcher from "@/app/components/CompanySwitcher";

type Role = "owner" | "admin" | "manager" | "viewer";

type Company = {
  id: string;
  name: string;
  status: string | null;
  created_at: string | null;
  role: Role;
};

type CompanyUser = {
  id: string;
  email: string;
  role: Role;
};

export default function CompaniesPage() {
  return (
    <GlobalCompaniesGuard>
      <CompaniesPageInner />
    </GlobalCompaniesGuard>
  );
}

function CompaniesPageInner() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("manager");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    loadCompanies();
    loadActiveCompany();
  }, []);

  async function loadActiveCompany() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("id", user.id)
      .single();

    setActiveCompanyId(data?.active_company_id || null);
    if (data?.active_company_id) {
      loadCompanyUsers(data.active_company_id);
    }
  }

  async function loadCompanies() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("company_users")
      .select(`
        role,
        companies (
          id,
          name,
          status,
          created_at
        )
      `)
      .eq("auth_user_id", user.id);

    setCompanies(
      data?.map((row: any) => ({
        ...row.companies,
        role: row.role,
      })) || []
    );

    setLoading(false);
  }

  async function loadCompanyUsers(companyId: string) {
    const { data } = await supabase
      .from("company_users")
      .select("id, email, role")
      .eq("company_id", companyId);

    setUsers(data || []);
  }

  /* ================= CREATE COMPANY ================= */

  async function createCompany() {
    if (!newCompanyName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: company } = await supabase
      .from("companies")
      .insert({
        name: newCompanyName.trim(),
        owner_id: user.id,
        owner_email: user.email,
        status: "active",
      })
      .select()
      .single();

    if (!company) return;

    await supabase.from("company_users").insert({
      company_id: company.id,
      auth_user_id: user.id,
      email: user.email,
      role: "owner",
    });

    setNewCompanyName("");
    loadCompanies();
  }

  /* ================= SWITCH COMPANY ================= */

  async function switchCompany(companyId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ active_company_id: companyId })
      .eq("id", user.id);

    window.location.href = "/dashboard";
  }

  /* ================= INVITE USER ================= */

  async function inviteUser() {
    if (!inviteEmail || !activeCompanyId) return;

    await supabase.from("company_users").insert({
      company_id: activeCompanyId,
      email: inviteEmail,
      role: inviteRole,
    });

    setInviteEmail("");
    loadCompanyUsers(activeCompanyId);
  }

  async function updateUserRole(id: string, role: Role) {
    await supabase
      .from("company_users")
      .update({ role })
      .eq("id", id);

    if (activeCompanyId) loadCompanyUsers(activeCompanyId);
  }

  async function removeUser(id: string) {
    await supabase.from("company_users").delete().eq("id", id);
    if (activeCompanyId) loadCompanyUsers(activeCompanyId);
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-gray-600">Enterprise company management</p>
        </div>
        <CompanySwitcher />
      </div>

      {/* CREATE COMPANY */}
      <div className="p-4 border rounded bg-gray-50 mb-10">
        <h2 className="font-semibold mb-3">Create Company</h2>
        <input
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          placeholder="Company name"
          className="border p-2 rounded w-full mb-3"
        />
        <button
          onClick={createCompany}
          className="px-4 py-2 text-white rounded"
          style={{ backgroundColor: "#b80d0d" }}
        >
          Create Company
        </button>
      </div>

      {/* YOUR COMPANIES */}
      <h2 className="font-semibold mb-4">Your Companies</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3 mb-10">
          {companies.map((c) => (
            <li key={c.id} className="p-4 border rounded flex justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-500">Role: {c.role}</p>
              </div>
              <button
                onClick={() => switchCompany(c.id)}
                className="px-3 py-1 rounded text-white"
                style={{ backgroundColor: "#b80d0d" }}
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* USERS & ROLES */}
      {activeCompanyId && (
        <>
          <h2 className="font-semibold mb-3">Manage Users & Roles</h2>

          <div className="p-4 border rounded bg-gray-50 mb-6">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@email.com"
              className="border p-2 rounded w-full mb-2"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="border p-2 rounded w-full mb-3"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={inviteUser}
              className="px-4 py-2 text-white rounded"
              style={{ backgroundColor: "#b80d0d" }}
            >
              Invite User
            </button>
          </div>

          <ul className="space-y-3">
            {users.map((u) => (
              <li key={u.id} className="p-3 border rounded flex justify-between">
                <span>{u.email}</span>
                <div className="flex gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value as Role)}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => removeUser(u.id)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
