"use client";

import { createContext, useContext } from "react";

type OnlineStats = {
  partners: number;
  admins: number;
  total: number;
};

const AdminPresenceContext = createContext<OnlineStats | null>(null);

export function AdminPresenceProvider({
  value,
  children,
}: {
  value: OnlineStats;
  children: React.ReactNode;
}) {
  return (
    <AdminPresenceContext.Provider value={value}>
      {children}
    </AdminPresenceContext.Provider>
  );
}

export function useAdminPresence() {
  const ctx = useContext(AdminPresenceContext);
  if (!ctx) {
    throw new Error("useAdminPresence must be used inside AdminPresenceProvider");
  }
  return ctx;
}
