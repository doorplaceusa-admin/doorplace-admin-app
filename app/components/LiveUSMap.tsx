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

  // ✅ NEW
  page_title?: string;
  page_url?: string;
  page_key?: string;
};


/* ============================================
   ✅ STATE CENTROID FALLBACK (ALL 50 STATES)
   Used when visitor comes in like:
   city = "California", coords missing
============================================ */

const brandRed = "#b80d0d";

const STATE_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  Alabama: { lat: 32.8067, lon: -86.7911 },
  Alaska: { lat: 61.3707, lon: -152.4044 },
  Arizona: { lat: 33.7298, lon: -111.4312 },
  Arkansas: { lat: 34.9697, lon: -92.3731 },
  California: { lat: 36.1162, lon: -119.6816 },
  Colorado: { lat: 39.0598, lon: -105.3111 },
  Connecticut: { lat: 41.5978, lon: -72.7554 },
  Delaware: { lat: 39.3185, lon: -75.5071 },
  Florida: { lat: 27.7663, lon: -81.6868 },
  Georgia: { lat: 33.0406, lon: -83.6431 },
  Hawaii: { lat: 21.0943, lon: -157.4983 },
  Idaho: { lat: 44.2405, lon: -114.4788 },
  Illinois: { lat: 40.3495, lon: -88.9861 },
  Indiana: { lat: 39.8494, lon: -86.2583 },
  Iowa: { lat: 42.0115, lon: -93.2105 },
  Kansas: { lat: 38.5266, lon: -96.7265 },
  Kentucky: { lat: 37.6681, lon: -84.6701 },
  Louisiana: { lat: 31.1695, lon: -91.8678 },
  Maine: { lat: 44.6939, lon: -69.3819 },
  Maryland: { lat: 39.0639, lon: -76.8021 },
  Massachusetts: { lat: 42.2302, lon: -71.5301 },
  Michigan: { lat: 43.3266, lon: -84.5361 },
  Minnesota: { lat: 45.6945, lon: -93.9002 },
  Mississippi: { lat: 32.7416, lon: -89.6787 },
  Missouri: { lat: 38.4561, lon: -92.2884 },
  Montana: { lat: 46.9219, lon: -110.4544 },
  Nebraska: { lat: 41.1254, lon: -98.2681 },
  Nevada: { lat: 38.3135, lon: -117.0554 },
  "New Hampshire": { lat: 43.4525, lon: -71.5639 },
  "New Jersey": { lat: 40.2989, lon: -74.521 },
  "New Mexico": { lat: 34.8405, lon: -106.2485 },
  "New York": { lat: 42.1657, lon: -74.9481 },
  "North Carolina": { lat: 35.6301, lon: -79.8064 },
  "North Dakota": { lat: 47.5289, lon: -99.784 },
  Ohio: { lat: 40.3888, lon: -82.7649 },
  Oklahoma: { lat: 35.5653, lon: -96.9289 },
  Oregon: { lat: 44.572, lon: -122.0709 },
  Pennsylvania: { lat: 40.5908, lon: -77.2098 },
  "Rhode Island": { lat: 41.6809, lon: -71.5118 },
  "South Carolina": { lat: 33.8569, lon: -80.945 },
  "South Dakota": { lat: 44.2998, lon: -99.4388 },
  Tennessee: { lat: 35.7478, lon: -86.6923 },
  Texas: { lat: 31.0545, lon: -97.5635 },
  Utah: { lat: 40.15, lon: -111.8624 },
  Vermont: { lat: 44.0459, lon: -72.7107 },
  Virginia: { lat: 37.7693, lon: -78.17 },
  Washington: { lat: 47.4009, lon: -121.4905 },
  "West Virginia": { lat: 38.4912, lon: -80.9545 },
  Wisconsin: { lat: 44.2685, lon: -89.6165 },
  Wyoming: { lat: 42.756, lon: -107.3025 },
};

/* ============================================
   COMPONENT
============================================ */

export default function LiveUSMap({
  visitors = [],
  fullscreen = false,
}: {
  visitors?: LiveVisitor[];
  fullscreen?: boolean;
}) {


 const width = 1200;
const height = fullscreen ? 900 : 550;

const desktop = typeof window !== "undefined" && window.innerWidth > 900;

const viewHeight = fullscreen
  ? 900
  : desktop
  ? 700   // desktop bigger
  : 550;  // mobile stays EXACT


  const [selected, setSelected] = useState<LiveVisitor | null>(null);
const [zoomScale, setZoomScale] = useState(1);


  /* ============================================
     PROJECTION
  ============================================ */

 const projection = useMemo(() => {
  const proj = geoAlbersUsa();

  // ✅ Correct GeoJSON FeatureCollection
  const geo = feature(
    us as any,
    (us as any).objects.states
  ) as any;

  // ✅ Auto-fit into the SVG box
  proj.fitSize([width, height], geo);

  // ✅ Manual fine-tuning controls
  const t = proj.translate();

  const moveX = -65; // left/right
  const moveY = -65;  // up/down

  proj.translate([t[0] + moveX, t[1] + moveY]);

  return proj;
}, [width, height]);





  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  /* ============================================
     LOAD REAL US STATES
  ============================================ */

  const states = useMemo(() => {
    const geo = feature(us as any, (us as any).objects.states) as any;
    return geo.features;
  }, []);

  /* ============================================
     CLUSTER VISITORS
  ============================================ */

  const clustered = useMemo(() => {
    const grouped: Record<string, LiveVisitor> = {};

    visitors.forEach((v) => {
      const key = `${v.city}-${v.state}-${v.page_url}`;


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
        <h2
  style={{
    fontSize: fullscreen ? "26px" : "18px",
    fontWeight: 700,
  }}
>
  Visitors Right Now
</h2>


        <span
  style={{
    fontSize: fullscreen ? "16px" : "13px",
    color: "#6b7280",
  }}
>
  Live Activity Map (USA)
</span>

      </div>

      {/* Zoom Wrapper */}
      <div
  style={{
    width: "100%",
    height: fullscreen ? "100vh" : "200px",
    position: "relative",


    borderRadius: fullscreen ? "0px" : "22px",
    overflow: "hidden",

    background: "#f7f8fa",

    border: fullscreen ? "none" : "1px solid #e5e7eb",
    boxShadow: fullscreen
      ? "none"
      : "0 10px 35px rgba(0,0,0,0.08)",

    padding: "0px",

    display: "flex",
    flexDirection: "column",
  }}
>

  <TransformWrapper
    initialScale={1.15}
    minScale={1}
    maxScale={6}
    wheel={{ step: 0.25 }}
    doubleClick={{ disabled: true }}
    onTransformed={(ref) => {
      setZoomScale(ref.state.scale);
    }}
  >
    <TransformComponent
  wrapperStyle={{
    width: "100%",
    height: "100%",
  }}
  contentStyle={{
    width: "100%",
    height: "100%",
  }}
>

  
  <svg
  width="100%"
  viewBox={`0 0 ${width} ${viewHeight}`}
  preserveAspectRatio="xMidYMid meet"



    style={{
      flex: 1,
      borderRadius: fullscreen ? "0px" : "18px",
      background: "#f8fafc",
    }}
  >
    {/* USA STATES */}
    {states.map((state: any, i: number) => (
      <path
        key={i}
        d={pathGenerator(state) || ""}
        fill="#f1f5f9"
        stroke="#475569"
        strokeWidth={1.5}
      />
    ))}

    {/* Visitor Bubbles */}
    {clustered.map((v, i) => {
      let lat = v.latitude;
      let lon = v.longitude;

      if ((!lat || !lon) && STATE_CENTROIDS[v.city]) {
        lat = STATE_CENTROIDS[v.city].lat;
        lon = STATE_CENTROIDS[v.city].lon;
      }

      const coords = projection([lon, lat]);
      if (!coords) return null;

      const [x, y] = coords;

      const safeCount = Number(v.count || 1);
      const radius = Math.min(45, 10 + Math.sqrt(safeCount) * 6);

      return (
        <g
          key={i}
          style={{ cursor: "pointer" }}
          onClick={() => setSelected(v)}
        >
          {/* Pulse Ring */}
          <circle
            cx={x}
            cy={y}
            r={radius + 6}
            fill="none"
            stroke={brandRed}
            strokeWidth={2.5}
            opacity={0.35}
          >
            <animate
              attributeName="r"
              values={`${radius};${radius + 18}`}
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Soft Glow */}
          <circle
            cx={x}
            cy={y}
            r={radius + 12}
            fill={brandRed}
            opacity={0.18}
          />

          {/* Main Bubble */}
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill={brandRed}
            opacity={0.92}
          />

          {/* City Label (only when zoomed in) */}
          {zoomScale > 2.2 && (
            <text
              x={x}
              y={y + radius + 18}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#111827"
            >
              {v.city}
            </text>
          )}

          {/* Count */}
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="white"
          >
            {safeCount}
          </text>
        </g>
      );
    })}
  </svg>
</TransformComponent>

  </TransformWrapper>
</div>

{/* ================================
    CLICK POPUP INFO BOX
================================ */}
{selected && (
  <div
    style={{
      position: fullscreen ? "absolute" : "relative",

      bottom: fullscreen ? "25px" : "auto",
      left: fullscreen ? "25px" : "auto",

      marginTop: fullscreen ? "0px" : "14px",

      width: fullscreen ? "320px" : "100%",

      padding: "14px 16px",
      borderRadius: "14px",
      border: "1px solid #e5e7eb",
      background: "white",
      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
      zIndex: 9999,
    }}
  >

    {/* Header */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <strong style={{ fontSize: "15px" }}>
        {selected.city}, {selected.state}
      </strong>

      <button
        onClick={() => setSelected(null)}
        style={{
          border: "none",
          background: "transparent",
          fontSize: "16px",
          cursor: "pointer",
          color: "#6b7280",
        }}
      >
        ✕
      </button>
    </div>

    {/* Visitors */}
    <div style={{ fontSize: "13px", marginBottom: "6px" }}>
      👀 <strong>{selected.count}</strong> visitors right now
    </div>

    {/* Page Title */}
    {selected.page_key && (
  <div style={{ fontSize: "13px", marginBottom: "6px" }}>
    📄 <strong>Page:</strong> {selected.page_key}
  </div>
)}


    {/* Page URL */}
    {selected.page_url && (
      <div style={{ fontSize: "13px" }}>
    🔗{" "}
    <a
      href={`https://doorplaceusa.com${selected.page_url}`}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "#b80d0d",
        fontWeight: 700,
        textDecoration: "underline",
      }}
    >
      Open Live Page
    </a>
      </div>
    )}
  </div>
)}

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
