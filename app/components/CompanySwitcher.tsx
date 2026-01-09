"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Company = {
  id: string;
  name: string;
};

export default function CompanySwitcher() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_company_id")
      .single();

    setActiveCompany(profile?.active_company_id ?? null);

    const { data } = await supabase
      .from("companies")
      .select("id,name")
      .order("name");

    setCompanies(data || []);
  }

  async function switchCompany(companyId: string) {
    await supabase
      .from("profiles")
      .update({ active_company_id: companyId })
      .eq("id", (await supabase.auth.getUser()).data.user?.id);

    setActiveCompany(companyId);
    location.reload();
  }

  if (!companies.length) return null;

  return (
    <select
      value={activeCompany ?? ""}
      onChange={(e) => switchCompany(e.target.value)}
    >
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
