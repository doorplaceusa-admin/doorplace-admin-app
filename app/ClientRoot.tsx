"use client";

import { useLiveSession } from "@/lib/useLiveSession";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  useLiveSession();
  return <>{children}</>;
}
