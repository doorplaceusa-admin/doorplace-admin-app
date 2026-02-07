"use client";

import React, { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { feature } from "topojson-client";
import us from "us-atlas/states-10m.json";

/* ============================================
   TYPES
============================================ */

type LiveVisitor = {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  count: number;
};

/* ============================================
   HELPERS
============================================ */

// Bubble size scaling
function bubbleRadius(count: number) {
  return Math.min(34, 10 + count * 3);
}

// Bubble color scaling (traffic intensity)
function bubbleColor(count: number) {
  if (count >= 10) return "#dc2626"; // Red = Hot
  if (count >= 5) return "#f97316"; // Orange = Medium
  return "#7c3aed"; // Purple = Light
}

/* ============================================
   COMPONENT
============================================ */

export default function LiveUSMap({
  visitors,
}: {
  visitors: LiveVisitor[];
}) {
  const width = 900;
  const height = 520;

  /* ============================================
     TOOLTIP STATE
  ============================================ */

  const [hovered, setHovered] = useState<LiveVisitor | null>(null);

  /* ============================================
     PROJECTION
  ============================================ */

  const projection = useMemo(() => {
    return geoAlbersUsa()
      .scale(1200)
      .translate([width / 2, height / 2]);
  }, []);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  /* ============================================
     LOAD REAL US STATES
  ============================================ */

  const states = useMemo(() => {
    const geo = feature(
      us as any,
      (us as any).objects.states
    ) as any;

    return geo.features;
  }, []);

  /* ============================================
     CLUSTER VISITORS (PACK 5 FOUNDATION)
     - Groups by city/state
     - Later can upgrade to proximity clustering
  ============================================ */

  const clustered = useMemo(() => {
    const grouped: Record<string, LiveVisitor> = {};

    visitors.forEach((v) => {
      if (!v.city || !v.state) return;

      const key = `${v.city}-${v.state}`;

      if (!grouped[key]) {
        grouped[key] = { ...v };
      } else {
        grouped[key].count += v.count;
      }
    });

    return Object.values(grouped);
  }, [visitors]);

  /* ============================================
     RENDER
  ============================================ */

  return (
    <div
      style={{
        width: "100%",
        borderRadius: "22px",
        overflow: "hidden",
        background: "#f7f8fa",
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        padding: "18px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
          Visitors Right Now
        </h2>

        <span style={{ fontSize: "13px", color: "#6b7280" }}>
          Live Activity Map (USA)
        </span>
      </div>

      {/* Zoom Wrapper */}
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={6}
        wheel={{ step: 0.25 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent wrapperStyle={{ position: "relative" }}>
          {/* Tooltip */}
          {hovered && (
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                background: "white",
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "13px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                zIndex: 20,
              }}
            >
              <strong>
                {hovered.city}, {hovered.state}
              </strong>
              <div>{hovered.count} visitors</div>
            </div>
          )}

          {/* SVG MAP */}
          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{
              borderRadius: "18px",
              background: "#eef2f7",
            }}
          >
            {/* USA STATES */}
            {states.map((state: any, i: number) => (
              <path
                key={i}
                d={pathGenerator(state) || ""}
                fill="#dfe6ef"
                stroke="#c7ced8"
                strokeWidth={1}
              />
            ))}

            {/* Visitor Bubbles */}
            {clustered.map((v, i) => {
              const coords = projection([v.longitude, v.latitude]);
              if (!coords) return null;

              const [x, y] = coords;

              const radius = bubbleRadius(v.count);
              const color = bubbleColor(v.count);

              return (
                <g key={i}>
                  {/* Bubble */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={color}
                    opacity={0.85}
                    onMouseEnter={() => setHovered(v)}
                    onMouseLeave={() => setHovered(null)}
                  />

                  {/* Count Label */}
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill="white"
                  >
                    {v.count}
                  </text>

                  {/* City Labels (PACK 4) */}
                  {v.count >= 2 && (
                    <text
                      x={x}
                      y={y + radius + 16}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#111827"
                    >
                      {v.city}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Footer */}
      <div
        style={{
          marginTop: "14px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        <span>Scroll or pinch to zoom</span>
        <span>{clustered.length} active locations</span>
      </div>
    </div>
  );
}
