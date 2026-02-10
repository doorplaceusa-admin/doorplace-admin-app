"use client";

import React, { useMemo, useState } from "react";

import { geoAlbersUsa, geoPath, geoCentroid } from "d3-geo";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { feature } from "topojson-client";
import us from "us-atlas/states-10m.json";

import nationData from "us-atlas/nation-10m.json";





/* ============================================
   TYPES
============================================ */

type LiveVisitor = {
  city: string;
  state: string;
  latitude: number | null;
longitude: number | null;

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
// ✅ Convert state abbreviations ("OH") → full state names ("Ohio")
// Needed because STATE_CENTROIDS uses full names
const STATE_NAME_BY_ABBR: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

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
   ✅ STATE ABBREVIATIONS (FIPS ID → ABBR)
   states-10m features typically have numeric FIPS ids
============================================ */

const STATE_ABBR_BY_FIPS: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};
/* ============================================
   ✅ STATE LABEL OFFSETS (PIXEL NUDGES)
   Fixes weird centroid placements like Florida
============================================ */

const STATE_LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  "12": { dx: 18, dy: 10 }, // Florida

  "22": { dx: -9, dy: -10 }, // Louisiana
};


/* ============================================
   COMPONENT
============================================ */

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

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

  function getDotColor(v: LiveVisitor) {
    const key = (v.page_key || "").toLowerCase();
    const url = (v.page_url || "").toLowerCase();

    // ✅ Porch Swing Pages
    if (key.includes("swing") || url.includes("swing")) {
      return "#b80d0d"; // Doorplace Red
    }

    // ✅ Door Pages
    if (key.includes("door") || url.includes("door")) {
      return "#2563eb"; // Blue
    }

    // ✅ Partner / Funnel Pages
    if (key.includes("partner") || url.includes("partner")) {
      return "#16a34a"; // Green
    }

    // Default fallback
    return "#7c3aed"; // Purple (other)
  }

  const viewHeight = fullscreen ? 900 : desktop ? 700 : 550;

  const [selected, setSelected] = useState<LiveVisitor | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // ✅ UI-only state for hover effects (design upgrade)
  const [hoveredStateKey, setHoveredStateKey] = useState<string | null>(null);

  // ✅ Design toggles (you can flip these anytime)
  const SHOW_OCEAN = true;
  const SHOW_STATE_LABELS = true;
  const SHOW_GRATICULE = false; // keep false by default (super subtle if true)

  /* ============================================
     PROJECTION
  ============================================ */

  const projection = useMemo(() => {
    const proj = geoAlbersUsa();

    // ✅ Correct GeoJSON FeatureCollection
    const geo = feature(us as any, (us as any).objects.states) as any;

    // ✅ Auto-fit into the SVG box
    proj.fitSize([width, height], geo);

    // ✅ Manual fine-tuning controls
    const t = proj.translate();

    const moveX = -65; // left/right
    const moveY = -65; // up/down

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
   ✅ USA OUTLINE (REAL COASTLINE)
============================================ */

const nation = useMemo(() => {
  const geo = feature(
    nationData as any,
    (nationData as any).objects.nation
  ) as any;

  return geo;
}, []);









  /* ============================================
     ✅ STATE LABEL POINTS (ABBREVIATIONS)
     Uses geoCentroid(feature) projected into your SVG
  ============================================ */

  const stateLabels = useMemo(() => {
    return states
      .map((s: any) => {
        // states-10m usually gives a numeric id (FIPS)
        const rawId = s.id;
        const fips = String(rawId).padStart(2, "0");
        const abbr = STATE_ABBR_BY_FIPS[fips];

        if (!abbr) return null;

        // centroid in lon/lat
        const [lon, lat] = geoCentroid(s);
        const coords = projection([lon, lat]);
        if (!coords) return null;

        const [x, y] = coords;

// ✅ Apply manual offset if needed (Florida fix)
const offset = STATE_LABEL_OFFSETS[fips] || { dx: 0, dy: 0 };

return {
  key: fips,
  abbr,
  x: x + offset.dx,
  y: y + offset.dy,
};

      })
      .filter(Boolean) as Array<{ key: string; abbr: string; x: number; y: number }>;
  }, [states, projection]);

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

      {/* ✅ Legend */}
      <div
        style={{
          display: "flex",
          gap: "5px",
          flexWrap: "wrap",
          fontSize: "9px",
          marginBottom: "10px",
          color: "#374151",
        }}
      >
        <LegendItem color="#b80d0d" label="Swing Pages" />
        <LegendItem color="#2563eb" label="Door Pages" />
        <LegendItem color="#16a34a" label="Partner Funnels" />
        <LegendItem color="#7c3aed" label="Other Pages" />
      </div>

      {/* Zoom Wrapper */}
      <div
        style={{
          width: "100%",
          height: fullscreen
  ? "calc(100vh - 220px)"
  : desktop
  ? "475px"
  : "200px",

          position: "relative",

          borderRadius: fullscreen ? "0px" : "22px",
          overflow: "hidden",

          background: "#f7f8fa",

          border: fullscreen ? "none" : "1px solid #e5e7eb",
          boxShadow: fullscreen ? "none" : "0 10px 35px rgba(0,0,0,0.08)",

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
              height="100%"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                flex: 1,
                display: "block",
                borderRadius: fullscreen ? "0px" : "18px",
                background: "#f8fafc",
              }}
            >
              {/* ============================
                  ✅ SVG DEFS (DESIGN UPGRADE)
              ============================ */}
              <defs>
                {/* soft ocean gradient */}
                <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8f2ff" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>

                {/* land subtle gradient */}
                <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f6f8fb" />
                  <stop offset="100%" stopColor="#eef2f7" />
                </linearGradient>

                {/* hover glow */}
                <filter id="hoverGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* subtle map shadow */}
                <filter id="mapSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
                </filter>

                {/* bubble shadow */}
                <filter id="bubbleShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#0f172a" floodOpacity="0.22" />
                </filter>
              </defs>

              {/* ✅ Ocean backdrop (TRUE infinite full coverage) */}
{SHOW_OCEAN && (
  <rect
    x="-3000"
    y="-3000"
    width="6000"
    height="6000"
    fill="url(#oceanGrad)"
  />
)}



              {/* ✅ Optional faint graticule (very subtle) */}
              {SHOW_GRATICULE && (
                <g opacity={0.18}>
                  {Array.from({ length: 13 }).map((_, i) => {
                    const x = (i * width) / 12;
                    return (
                      <line
                        key={`gx-${i}`}
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={height}
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="4 10"
                      />
                    );
                  })}
                  {Array.from({ length: 9 }).map((_, i) => {
                    const y = (i * height) / 8;
                    return (
                      <line
                        key={`gy-${i}`}
                        x1={0}
                        y1={y}
                        x2={width}
                        y2={y}
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="4 10"
                      />
                    );
                  })}
                </g>
              )}

              {/* ✅ States group w/ soft shadow */}
              {/* ✅ USA COASTLINE OUTLINE */}
<path
  d={pathGenerator(nation) || ""}
  fill="url(#landGrad)"
  stroke="#334155"
  strokeWidth={2}
  filter="url(#mapSoftShadow)"
/>






              <g filter="url(#mapSoftShadow)">
                {/* USA STATES */}
                {states.map((state: any, i: number) => {
                  const rawId = state.id;
                  const fips = String(rawId).padStart(2, "0");
                  const isHover = hoveredStateKey === fips;

                  return (
                    <path
                      key={i}
                      d={pathGenerator(state) || ""}
                      fill={isHover ? "#ffe5e5" : "url(#landGrad)"}
                      stroke={isHover ? "#334155" : "#475569"}
                      strokeWidth={isHover ? 2.2 : 1.5}
                      style={{
                        transition: "all 120ms ease",
                        cursor: "default",
                      }}
                      filter={isHover ? "url(#hoverGlow)" : undefined}
                      onMouseEnter={() => setHoveredStateKey(fips)}
                      onMouseLeave={() => setHoveredStateKey(null)}
                    />
                  );
                })}
              </g>

              {/* ✅ State Abbreviation Labels */}
              {SHOW_STATE_LABELS && (
                <g style={{ pointerEvents: "none" }}>
                  {stateLabels.map((l) => {
                    // Keep labels readable but not loud:
                    // - Slightly fade out when zoomed way in (so bubbles dominate)
                    const labelOpacity =
                      zoomScale > 3.2 ? 0.12 : zoomScale > 2.2 ? 0.18 : 0.28;

                    return (
                      <text
                        key={l.key}
                        x={l.x}
                        y={l.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={zoomScale > 2.2 ? 9 : 10}
                        fontWeight={800}
                        fill="#0f172a"
                        opacity={labelOpacity}
                        style={{
                          letterSpacing: "0.6px",
                          textShadow: "0 1px 0 rgba(255,255,255,0.65)",
                        }}
                      >
                        {l.abbr}
                      </text>
                    );
                  })}
                </g>
              )}

              {/* Visitor Bubbles */}
              {clustered.map((v, i) => {
                let lat = v.latitude;
                let lon = v.longitude;

                // ✅ Fallback ONLY if coords are missing
// ✅ Fallback ONLY if coords are missing
// Fixes Ohio dots landing in Illinois
if (lat == null || lon == null) {
  // Convert "OH" → "Ohio"
  const stateName =
    STATE_NAME_BY_ABBR[v.state] || v.state;

  // Use centroid fallback if available
  if (STATE_CENTROIDS[stateName]) {
    lat = STATE_CENTROIDS[stateName].lat;
    lon = STATE_CENTROIDS[stateName].lon;
  }
}


if (lat == null || lon == null) return null;

                const coords = projection([lon, lat]);
                if (!coords) return null;

                const [x, y] = coords;

                const safeCount = Number(v.count || 1);
                const radius = Math.min(45, 10 + Math.sqrt(safeCount) * 6);
                const dotColor = getDotColor(v);

                return (
                  <g
                    key={i}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(v)}
                    filter="url(#bubbleShadow)"
                  >
                    {/* Pulse Ring */}
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 6}
                      fill="none"
                      stroke={dotColor}
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
                    <circle cx={x} cy={y} r={radius + 12} fill={dotColor} opacity={0.18} />

                    {/* Main Bubble */}
                    <circle cx={x} cy={y} r={radius} fill={dotColor} opacity={0.92} />

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
