"use client";

import { useEffect, useState, useRef } from "react";

import LiveUSMap from "@/app/components/LiveUSMap";

const REFRESH_INTERVAL = 8000;

export default function MapWallPage() {
  const [liveVisitors, setLiveVisitors] = useState<any[]>([]);
  const inflight = useRef(false);

  async function loadLiveMap() {
  if (inflight.current) return;
  inflight.current = true;

  try {
    const res = await fetch("/api/live-map");
    const data = await res.json();

    if (data) setLiveVisitors(data);
  } catch (err) {
    console.error("Map fetch failed", err);
  } finally {
    inflight.current = false;
  }
}
  useEffect(() => {
    loadLiveMap();

    const interval = setInterval(loadLiveMap, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <LiveUSMap visitors={liveVisitors} fullscreen />
    </main>
  );
}
