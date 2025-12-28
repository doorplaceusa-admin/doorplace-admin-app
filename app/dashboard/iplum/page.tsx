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
    <div style={{ padding: 24 }}>
      <h1>📞 iPlum Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!error && !data && <p>Loading...</p>}

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
