"use client";

import { useEffect } from "react";
import { useLiveSession } from "@/lib/useLiveSession";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  useLiveSession();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return <>{children}</>;
}
