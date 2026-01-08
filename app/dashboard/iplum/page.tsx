"use client";

import { useEffect, useState } from "react";

export default function IPlumPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/iplum")
      .then(res => res.json())
      .then(data => {
        console.log("iPlum data:", data);
        setData(data);
      })
      .catch(() => {
        setError("Failed to load iPlum data");
      });
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-[1500px] w-full mx-auto">
      <h1>📞 iPlum Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!error && !data && <p>Loading...</p>}

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
