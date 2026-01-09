// components/GlobalCompaniesGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GlobalCompaniesGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAllowed(false);
      return;
    }

    const { data } = await supabase
      .from("company_users")
      .select("role")
      .eq("auth_user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1);

    setAllowed(!!data?.length);
  }

  if (allowed === null) return null;
  if (!allowed) return <p className="text-red-600">Access denied</p>;

  return <>{children}</>;
}
