"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoAlbersUsa, geoPath, geoCentroid } from "d3-geo";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { feature } from "topojson-client";

import us from "us-atlas/states-10m.json";
import nationData from "us-atlas/nation-10m.json";

/* ======================================================
   TYPES
====================================================== */

type LiveVisitor = {
  city: string | null;
  state: string;
  latitude: number | null;
  longitude: number | null;
  count: number;

  /* NEW unified feed fields */
  source: "human";


  page_url?: string;
  page_key?: string;
};


type Category =
  | "swing"
  | "door";

type Dot = {
  id: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  count: number;
  page_key?: string;
  page_url?: string;
  category: Category;
};

type Cluster = {
  id: string;
  x: number;
  y: number;
  lat: number;
  lon: number;
  total: number;
  category: Category;
  items: Dot[];
  topLabel: string; // “Dallas, TX”
};

/* ======================================================
   BRAND / THEME
====================================================== */
const brandRed = "#ef4444";

const COLORS: Record<Category, string> = {
  swing: brandRed,
  door: "#2563eb",

};



/* ======================================================
   STATE FALLBACKS
====================================================== */

const STATE_NAME_BY_ABBR: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
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
  "District of Columbia": { lat: 38.9072, lon: -77.0369 },
};

const STATE_ABBR_BY_FIPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
  "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
  "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
  "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY",
};
const US_CENTER = { lat: 39.8283, lon: -98.5795 };

const STATE_LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  "12": { dx: 18, dy: 10 }, // Florida
  "22": { dx: -9, dy: -10 }, // Louisiana
};


/* ======================================================
   PURE HELPERS
====================================================== */


function normalizeStateName(input: string): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  if (trimmed.length === 2) return STATE_NAME_BY_ABBR[trimmed.toUpperCase()] || trimmed;
  return trimmed;
}

function getCategory(v: LiveVisitor): Category | null {
  const key = (v.page_key || "").toLowerCase();
  const url = (v.page_url || "").toLowerCase();

  if (key.includes("swing") || url.includes("swing")) return "swing";
  if (key.includes("door") || url.includes("door")) return "door";

  return null; // ❌ everything else is ignored
}



function safeInt(n: any, fallback = 1) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0 ? Math.floor(x) : fallback;
}





function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Enterprise clustering:
 * - project each dot to x/y
 * - group dots within `pixelRadius` distance
 * - accumulate total + keep items
 */
function clusterByPixels(
  dots: Dot[],
  project: (lon: number, lat: number) => [number, number] | null,
  pixelRadius: number
): Cluster[] {
  const r2 = pixelRadius * pixelRadius;

  // Very fast bucket grid to avoid O(n^2) in spikes
  const cellSize = pixelRadius * 1.25;
  const buckets = new Map<string, number[]>();

  const pts = dots
    .map((d, idx) => {
      const p = project(d.lon, d.lat);
      if (!p) return null;
      return { idx, x: p[0], y: p[1] };
    })
    .filter(Boolean) as Array<{ idx: number; x: number; y: number }>;

  for (const p of pts) {
    const cx = Math.floor(p.x / cellSize);
    const cy = Math.floor(p.y / cellSize);
    const key = `${cx}:${cy}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p.idx);
  }

  const visited = new Array(dots.length).fill(false);
  const clusters: Cluster[] = [];

  const neighborCells = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],  [0, 0],  [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];

  function getBucketIndices(x: number, y: number) {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const out: number[] = [];
    for (const [dx, dy] of neighborCells) {
      const k = `${cx + dx}:${cy + dy}`;
      const arr = buckets.get(k);
      if (arr) out.push(...arr);
    }
    return out;
  }

  for (const p of pts) {
    if (visited[p.idx]) continue;

    const seedDot = dots[p.idx];
    const items: Dot[] = [seedDot];
    visited[p.idx] = true;

    let sumX = p.x * seedDot.count;
    let sumY = p.y * seedDot.count;
    let sumCount = seedDot.count;

    // Expand cluster by scanning nearby candidates
    const candidates = getBucketIndices(p.x, p.y);

    for (const ci of candidates) {
      if (visited[ci]) continue;

      const d = dots[ci];
      const pp = project(d.lon, d.lat);
      if (!pp) continue;

      const dx = pp[0] - p.x;
      const dy = pp[1] - p.y;
      if (dx * dx + dy * dy <= r2) {
        visited[ci] = true;
        items.push(d);
        sumX += pp[0] * d.count;
        sumY += pp[1] * d.count;
        sumCount += d.count;
      }
    }

    const x = sumX / Math.max(1, sumCount);
    const y = sumY / Math.max(1, sumCount);

    // Pick dominant category
    const catTotals: Record<Category, number> = {
  swing: 0,
  door: 0,
};

    for (const it of items) catTotals[it.category] += it.count;

    const category = (Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "swing") as Category;

    // pick top label (most count item)
    const top = items.slice().sort((a, b) => b.count - a.count)[0];
   const topLabel = `${top.city || top.page_key || "Unknown"}, ${top.state}`;




    clusters.push({
      id: `c_${top.id}_${Math.round(x)}_${Math.round(y)}`,
      x,
      y,
      lat: top.lat,
      lon: top.lon,
      total: sumCount,
      category,
      items,
      topLabel,
    });
  }

  return clusters;
}

/* ======================================================
   UI PIECES
====================================================== */

function Pill({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? color : "#e5e7eb"}`,
        background: active ? `${color}15` : "white",
        color: active ? "#111827" : "#374151",
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 120ms ease",
      }}
    >
      <span
  style={{
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "transparent",
    border: `2px solid ${color}`,
    display: "inline-block",
    opacity: 0.55,
  }}
/>
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "10px 12px",
        minWidth: 140,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function LiveUSMap({
  visitors = [],
  fullscreen = false,
}: {
  visitors?: LiveVisitor[];
  fullscreen?: boolean;
}) {
  const width = 1000;
const height = fullscreen ? 900 : 800;

  const desktop = typeof window !== "undefined" && window.innerWidth > 900;

  const viewHeight = fullscreen ? 900 : desktop ? 700 : 550;

  // “Enterprise mode” rendering controls
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [hoverCluster, setHoverCluster] = useState<Cluster | null>(null);

  const [zoomScale, setZoomScale] = useState(1);
  const [hoveredStateKey, setHoveredStateKey] = useState<string | null>(null);

  // Filters
  const [show, setShow] = useState<Record<Category, boolean>>({
  swing: true,
  door: true,
});


  // Search query for filtering dots
  const [query, setQuery] = useState<string>("");

  // ✅ Human window counter (adjustable)
const [humanWindowMinutes, setHumanWindowMinutes] = useState<number>(30);
const [humanCount, setHumanCount] = useState<number>(0);





// ✅ Human views counter (last X minutes)
useEffect(() => {
  async function loadHumanCount() {
    try {
      const res = await fetch(
        `/api/analytics/humans-last-window?minutes=${humanWindowMinutes}`
      );

      const json = await res.json();
      setHumanCount(json.count || 0);
    } catch (err) {
      console.error("Human count fetch failed", err);
    }
  }

  loadHumanCount();

  // Refresh every 30 seconds
  const refreshMs =
  humanWindowMinutes <= 10 ? 15000 :
  humanWindowMinutes <= 60 ? 30000 :
  60000;

const id = setInterval(loadHumanCount, refreshMs);


  return () => clearInterval(id);
}, [humanWindowMinutes]);


  // Spike protection: buffer incoming visitors, update map at most every 250ms
  const bufferRef = useRef<LiveVisitor[]>(visitors);
  const [renderVisitors, setRenderVisitors] = useState<LiveVisitor[]>(visitors);

  useEffect(() => {
  bufferRef.current = visitors;
}, [visitors]);


  useEffect(() => {
    const id = window.setInterval(() => {
      setRenderVisitors(bufferRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  /* ==========================
     GEO / PROJECTION
  ========================== */

 const projection = useMemo(() => {
  const proj = geoAlbersUsa();
  const geo = feature(us as any, (us as any).objects.states) as any;

  proj.fitSize([width, height], geo);

 proj.translate([width / 2, height / 2]);

  return proj;
}, [width, height]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const states = useMemo(() => {
    const geo = feature(us as any, (us as any).objects.states) as any;
    return geo.features;
  }, []);

  const nation = useMemo(() => {
    const geo = feature(nationData as any, (nationData as any).objects.nation) as any;
    return geo;
  }, []);

  const stateLabels = useMemo(() => {
    return states
      .map((s: any) => {
        const rawId = s.id;
        const fips = String(rawId).padStart(2, "0");
        const abbr = STATE_ABBR_BY_FIPS[fips];
        if (!abbr) return null;

        const [lon, lat] = geoCentroid(s);
        const coords = projection([lon, lat]);
        if (!coords) return null;

        const [x, y] = coords;
        const offset = STATE_LABEL_OFFSETS[fips] || { dx: 0, dy: 0 };

        return { key: fips, abbr, x: x + offset.dx, y: y + offset.dy };
      })
      .filter(Boolean) as Array<{ key: string; abbr: string; x: number; y: number }>;
  }, [states, projection]);

  const projectLonLat = useCallback(
    (lon: number, lat: number) => {
      const p = projection([lon, lat]);
      if (!p) return null;
      return [p[0], p[1]] as [number, number];
    },
    [projection]
  );

  /* ==========================
     NORMALIZE DOTS
  ========================== */

  const dots = useMemo<Dot[]>(() => {
  const q = query.trim().toLowerCase();
  const out: Dot[] = [];

  for (const v of renderVisitors) {
    const count = safeInt(v.count, 1);
    const category = getCategory(v);

    if (!category || !show[category]) continue;

    if ((v.page_url || "").includes("account/login")) continue;

    if (q) {
      const hay = `${v.city || ""} ${v.state || ""} ${v.page_key || ""} ${v.page_url || ""}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }

    let lat = v.latitude;
    let lon = v.longitude;

    if (lat == null || lon == null) {
      const stateName = normalizeStateName(v.state || "");
      const fallback = stateName ? STATE_CENTROIDS[stateName] : null;

      if (fallback) {
        lat = fallback.lat;
        lon = fallback.lon;
      } else {
        lat = US_CENTER.lat;
        lon = US_CENTER.lon;
      }
    }

    out.push({
      id: `${v.city || "unknown"}|${v.state}|${v.page_url || ""}|${v.page_key || ""}`,
      city: v.city || v.page_key || "Unknown Location",
      state: v.state || "",
      lat,
      lon,
      count,
      page_key: v.page_key,
      page_url: v.page_url,
      category,
    });
  }

  return out;
}, [renderVisitors, query, show]);

/* ==========================
   CLUSTERING (PIXEL BASED)
   - The higher zoom, the smaller cluster radius (more separation)
========================== */

const clusters = useMemo(() => {
  // Bigger radius when zoomed out so you don’t get dot soup
  const base =
    zoomScale <= 1.2 ? 34 :
    zoomScale <= 1.8 ? 26 :
    zoomScale <= 2.6 ? 18 :
    12;

  return clusterByPixels(dots, projectLonLat, base);
}, [dots, projectLonLat, zoomScale]);

/* ==========================
   KPI / SIDEBAR
========================== */

const totals = useMemo(() => {
  let totalVisitors = 0;

  const byCat = {
    swing: 0,
    door: 0,
  };

  for (const d of dots) {
    totalVisitors += d.count;
    byCat[d.category] += d.count;
  }

  return { totalVisitors, byCat };
}, [dots]);

const topClusters = useMemo(() => {
  return clusters
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, fullscreen ? 10 : 6);
}, [clusters, fullscreen]);

// Remove duplicate URLs inside the selected cluster (keeps first instance)
const uniqueItems = useMemo(() => {
  if (!selectedCluster) return [] as Dot[];

  return Array.from(
    new Map(
      selectedCluster.items
        .filter((it) => !(it.page_url || "").includes("account/login"))
        .map((it) => [((it.page_url || "") as string).toLowerCase(), it])
    ).values()
  );
}, [selectedCluster]);

/* ==========================
   ZOOM CONTROLS
========================== */

const zoomRef = useRef<ReactZoomPanPinchRef | ReactZoomPanPinchContentRef | null>(null);

const resetView = useCallback(() => {
  zoomRef.current?.resetTransform();
  setZoomScale(1);
  setSelectedCluster(null);
}, []);

const zoomToCluster = useCallback((c: Cluster) => {
  const ref = zoomRef.current;
  if (!ref) return;

  const el = document.getElementById(`cluster-${c.id}`);
  if (!el) return;

  ref.zoomToElement(el, 2.2, 400);
  setSelectedCluster(c);
}, []);

/* ==========================
   RENDER
========================== */

const mapHeightCss = fullscreen
  ? "calc(100vh - 180px)"
  : desktop
  ? "600px"
  : "320px";

const panelWidth = fullscreen ? 420 : 360;

return (
  <div
    style={{
      width: "100%",
      borderRadius: 24,
      overflow: "hidden",
      background: "#f7f8fa",
      border: "1px solid #e5e7eb",
      boxShadow: "0 14px 44px rgba(0,0,0,0.10)",
    }}
  >
      {/* ======================================================
          HEADER (KPI STRIP)
      ======================================================= */}
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: fullscreen ? 22 : 16, fontWeight: 800, letterSpacing: -0.4, color: "#0f172a" }}>
              Live Visitors
            </div>
            
          </div>

         <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
  
</div>

        </div>

        {/* Filters row */}
        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          
<select
  value={humanWindowMinutes}
  onChange={(e) => setHumanWindowMinutes(Number(e.target.value))}
  style={{
    padding: "6px 10px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    fontWeight: 800,
    background: "white",
    cursor: "pointer",
  }}
>
  <option value={1}>Last 1 min</option>
  <option value={10}>Last 10 min</option>
  <option value={30}>Last 30 min</option>
  <option value={60}>Last 1 hour</option>
  <option value={120}>Last 2 hours</option>
  <option value={360}>Last 6 hours</option>
  <option value={1440}>Last 24 hours</option>
</select>

          <Pill
            label={`Swing (${totals.byCat.swing})`}
            color={COLORS.swing}
            active={show.swing}
            onClick={() => setShow((s) => ({ ...s, swing: !s.swing }))}
          />
          <Pill
            label={`Door (${totals.byCat.door})`}
            color={COLORS.door}
            active={show.door}
            onClick={() => setShow((s) => ({ ...s, door: !s.door }))}
          />
          
          
          
        </div>
      </div>

      {/* ======================================================
          MAIN BODY (MAP + SIDE PANEL)
      ======================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: fullscreen ? `1fr ${panelWidth}px` : "1fr",
          gap: 0,
          borderTop: "1px solid #e5e7eb",
          background: "#eef2f7",
        }}
      >
        {/* MAP */}
        <div style={{ position: "relative", padding: 14 }}>
          <div
            style={{
              width: "100%",
              height: mapHeightCss,
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              background: "white",
              boxShadow: "0 12px 34px rgba(0,0,0,0.10)",
            }}
          >
          <TransformWrapper
  ref={zoomRef}
  minScale={1}
  maxScale={8}
  initialScale={1.4}
  centerOnInit
  wheel={{ step: 0.2 }}
  onTransformed={(ref) => {
    setZoomScale(ref.state.scale);
  }}
>
  {({ zoomIn, zoomOut, resetTransform }) => (
    <>
      <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>
        
      </div>

      <TransformComponent>
  <div style={{ width: "100%", height: "100%" }}>
    <svg
  viewBox={`0 0 ${width} ${height}`}
  preserveAspectRatio="xMidYMid meet"
  style={{ width: "100%", height: "100%" }}
>

  {/* ================= MAP BACKGROUND ================= */}

  {/* Nation */}
  <path
  d={pathGenerator(nation) || ""}
  fill="#f8fafc"
  stroke="#cbd5e1"
  strokeWidth={1}
/>

  {/* States */}
  {states.map((s: any) => {
  const fips = String(s.id).padStart(2, "0");
  const isHover = hoveredStateKey === fips;

  return (
    <path
      key={s.key}
      d={pathGenerator(s) || ""}
      fill={isHover ? "#fee2e2" : "#f1f5f9"}
      stroke={isHover ? "#64748b" : "#d1d5db"}
      strokeWidth={isHover ? 1.2 : 0.6}
      style={{ transition: "all 120ms ease" }}
      onMouseEnter={() => setHoveredStateKey(fips)}
      onMouseLeave={() => setHoveredStateKey(null)}
    />
  );
})}

{stateLabels.map((s) => {
  return (
    <text
      key={s.key}
      x={s.x}
      y={s.y}
      fontSize={10}
      textAnchor="middle"
      fill="#334155"
      style={{ pointerEvents: "none", fontWeight: 700 }}
    >
      {s.abbr}
    </text>
  );
})}

  {/* ================= CLUSTERS ================= */}

  {clusters
    .filter((c) => Number.isFinite(c.x) && Number.isFinite(c.y))
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((c) => {
      const safeCount = safeInt(c.total, 1);

      const radius = clamp(8 + Math.sqrt(safeCount) * 4, 8, 40);

      const x = clamp(c.x, 0, width);
      const y = clamp(c.y, 0, height);

      const dotColor = COLORS[c.category] || "#ff4d4f";

      return (
        <g
          key={c.id}
          id={`cluster-${c.id}`}
          transform={`translate(${x}, ${y})`}
          style={{ cursor: "pointer" }}
          onClick={() => zoomToCluster(c)}
          onMouseEnter={() => setHoverCluster(c)}
          onMouseLeave={() => setHoverCluster(null)}
        >
          <circle r={radius} fill={dotColor} opacity={0.85} />

          <text
            textAnchor="middle"
            dy=".3em"
            fontSize={10}
            fontWeight={800}
            fill="white"
          >
            {safeCount}
          </text>
        </g>
      );
    })}

    
    </svg>
  </div>
      </TransformComponent>
    </>
  )}
</TransformWrapper>
          </div>

         

         {/* Selected drawer */}
{selectedCluster && (
  <div
    style={{
      position: fullscreen ? "absolute" : "relative",
      marginTop: fullscreen ? 0 : 14,
      left: fullscreen ? 18 : "auto",
      bottom: fullscreen ? 18 : "auto",
      width: fullscreen ? 320 : "100%",
      maxHeight: fullscreen ? 420 : "none",
      overflowY: "auto",
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      padding: 12,
      zIndex: 20,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div style={{ fontWeight: 900 }}>{selectedCluster.topLabel}</div>

      <button onClick={() => setSelectedCluster(null)}>✕</button>
    </div>

    <div style={{ marginTop: 6, fontWeight: 800, color: COLORS[selectedCluster.category] }}>
      {selectedCluster.total.toLocaleString()} total
    </div>

    <div style={{ marginTop: 10 }}>
      {uniqueItems.slice(0, 25).map((it, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          {it.city}, {it.state}
        </div>
      ))}
    </div>
  </div>
)}

          {/* Footer */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#64748b",
              fontWeight: 700,
              padding: "0 6px",
            }}
          >
            
          </div>
        </div>

        {/* SIDE PANEL (enterprise navigation) */}
        {fullscreen && (
          <div style={{ borderLeft: "1px solid #e5e7eb", padding: 14, background: "#f8fafc" }}>
            <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a" }}>Top Live Locations</div>
            <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
              {topClusters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => zoomToCluster(c)}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    borderRadius: 18,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    padding: 12,
                    cursor: "pointer",
                    boxShadow: "0 10px 26px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.topLabel}
                      </div>
                      <div style={{ marginTop: 3, fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                        {c.items.length} events • {c.category.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 950, color: COLORS[c.category] }}>{c.total.toLocaleString()}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
