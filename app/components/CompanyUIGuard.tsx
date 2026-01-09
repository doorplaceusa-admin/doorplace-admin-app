"use client";

import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Role = "owner" | "admin" | "manager" | "viewer";

type Props = {
  children: ReactNode;
  requiredRole?: Role[];
};

export default function CompanyUIGuard({
  children,
  requiredRole,
}: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setAllowed(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile?.active_company_id) {
      setAllowed(false);
      return;
    }

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("role")
      .eq("company_id", profile.active_company_id)
      .eq("auth_user_id", userData.user.id)
      .single();

    if (!companyUser) {
      setAllowed(false);
      return;
    }

    if (requiredRole && !requiredRole.includes(companyUser.role)) {
      setAllowed(false);
      return;
    }

    setAllowed(true);
  }

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <div className="p-8 text-center text-red-600">
        Access denied
      </div>
    );
  }

  return <>{children}</>;
}
