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
  source: "human" | "crawler";

  crawler_name?: string | null;

  page_url?: string;
  page_key?: string;
};


type Category =
  | "swing"
  | "door"
  | "partner"
  | "partner_coverage" // 👥 COVERAGE DOTS (anonymous)
  | "crawler"
  | "other";

type Dot = {
  id: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  count: number;
  page_key?: string;
  page_url?: string;
  crawler_name?: string | null;
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
  partner: "#16a34a",

  partner_coverage: "#f59e0b",
 // 👥 Coverage (soft outline)

  crawler: "#0ea5e9",
  other: "#7c3aed",
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
// ✅ US Center fallback (for "Other" category)
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

function getCategory(v: LiveVisitor): Category {
  if (v.source === "crawler") return "crawler";

  const key = (v.page_key || "").toLowerCase();
  const url = (v.page_url || "").toLowerCase();

 // ✅ HARD LOCK
if (url.includes("swing-partner-lead")) return "partner";

// ✅ HARD LOCK homepage + login as OTHER
if (url === "/" || url.includes("account/login")) return "other";


  // ✅ Partner pages MUST win first
  if (key.includes("partner") || url.includes("partner")) return "partner";

  // ✅ Then swing
  if (key.includes("swing") || url.includes("swing")) return "swing";

  // ✅ Then door
  if (key.includes("door") || url.includes("door")) return "door";

  return "other";
}




function safeInt(n: any, fallback = 1) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0 ? Math.floor(x) : fallback;
}

function makeDotId(v: LiveVisitor) {
  return v.source === "crawler"
    ? `crawler|${v.state}|${v.crawler_name || "bot"}|${v.page_url || ""}`
    : `human|${v.city}|${v.state}|${v.page_url || ""}`;
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
  partner: 0,

  partner_coverage: 0, // 👥 NEW

  other: 0,
  crawler: 0,
};

    for (const it of items) catTotals[it.category] += it.count;

    const category = (Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "other") as Category;

    // pick top label (most count item)
    const top = items.slice().sort((a, b) => b.count - a.count)[0];
    const topLabel =
  top.category === "crawler"
    ? `🕷 ${top.crawler_name || "Crawler"} • ${top.state}`
    : top.category === "partner_coverage"
    ? `👥 ${sumCount} Partners • ${top.city}, ${top.state}`
    : `${top.city || top.page_key || "Unknown"}, ${top.state}`;




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
        padding: "7px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 120ms ease",
      }}
    >
      <span
  style={{
    width: 10,
    height: 10,
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
  const width = 1200;
  const height = fullscreen ? 900 : 550;

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
  partner: false,
  partner_coverage: false, // 👥 NEW
  crawler: false,
  other: false,
});


  // Search query for filtering dots
  const [query, setQuery] = useState<string>("");
// 👥 Partner Coverage Points
const [partnerCoverage, setPartnerCoverage] = useState<
  {
    city: string;
    state: string;
    partner_count: number;
    latitude: number;
    longitude: number;
  }[]
>([]);

useEffect(() => {
  async function loadPartnerCoverage() {
    try {
      const res = await fetch("/api/map/partners");
      const data = await res.json();

      setPartnerCoverage(data || []);

    } catch (err) {
      console.error("Partner coverage fetch failed", err);
    }
  }

  loadPartnerCoverage();
}, []);



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

    // Keep your same “move” feel but slightly refined
    const t = proj.translate();
    proj.translate([t[0] - 55, t[1] - 60]);
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
// ❌ Skip login noise completely
if ((v.page_url || "").includes("account/login")) continue;

      if (!show[category]) continue;

      // Search filter (city/state/page)
      if (q) {
        const hay = `${v.city || ""} ${v.state || ""} ${v.page_key || ""} ${v.page_url || ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      let lat = v.latitude;
      let lon = v.longitude;

      



     if (lat == null || lon == null) {
  if (v.source === "crawler") continue; // ❌ skip bad crawler rows

  // ✅ Other → US center
  if (category === "other") {
    lat = US_CENTER.lat;
    lon = US_CENTER.lon;
  }

  // ✅ Swing/Door/Partner → State centroid
  else {
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
}





      out.push({
  id: makeDotId(v),

  city: v.city || v.page_key || "Unknown Location",
  state: v.state || "",

  lat,
  lon,
  count,

  page_key: v.page_key,
  page_url: v.page_url,
  category,

  crawler_name: v.crawler_name || null, // ✅ ADD
});

    }
// ======================================================
// 👥 PARTNER COVERAGE DOTS (anonymous)
// ======================================================
for (const p of partnerCoverage) {
  if (!show.partner_coverage) continue;

  out.push({
    id: `partnercov|${p.city}|${p.state}`,

    city: p.city,
    state: p.state,

   lat: p.latitude
  ? Number(p.latitude)
  : (STATE_CENTROIDS[normalizeStateName(p.state)]?.lat ?? US_CENTER.lat) + (Math.random() - 0.5) * 1.2,

lon: p.longitude
  ? Number(p.longitude)
  : (STATE_CENTROIDS[normalizeStateName(p.state)]?.lon ?? US_CENTER.lon) + (Math.random() - 0.5) * 1.2,


    count: safeInt(p.partner_count, 1),

    category: "partner_coverage",
  });
}



    return out;
  }, [renderVisitors, query, show, partnerCoverage]);

  /* ==========================
     CLUSTERING (PIXEL BASED)
     - The higher zoom, the smaller cluster radius (more separation)
  ========================== */

  const clusters = useMemo(() => {
    // Bigger radius when zoomed out so you don’t get dot soup
    const base = zoomScale <= 1.2 ? 34 : zoomScale <= 1.8 ? 26 : zoomScale <= 2.6 ? 18 : 12;
    const humanDots = dots.filter((d) => d.category !== "crawler");
const crawlerDots = dots.filter((d) => d.category === "crawler");

return [
  ...clusterByPixels(humanDots, projectLonLat, base),
  ...clusterByPixels(crawlerDots, projectLonLat, base * 1.4),
];
  }, [dots, projectLonLat, zoomScale]);

  /* ==========================
     KPI / SIDEBAR
  ========================== */

  const totals = useMemo(() => {
      let totalVisitors = 0;
  const byCat: Record<Category, number> = {
  swing: 0,
  door: 0,
  partner: 0,

  partner_coverage: 0, // 👥 NEW

  other: 0,
  crawler: 0,
};

    for (const d of dots) {
      if (d.category !== "crawler") {
  totalVisitors += d.count;
}
      byCat[d.category] += d.count;
    }
    return { totalVisitors, byCat };
  }, [dots]);

  const topClusters = useMemo(() => {
  return clusters
    .filter((c) => c.category !== "crawler") // ✅ REMOVE CRAWLERS
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
    setSelectedCluster(null);
  }, []);

  const zoomToCluster = useCallback((c: Cluster) => {
  const ref = zoomRef.current;

  if (!ref) return;

  // ✅ Find the cluster DOM element
  const el = document.getElementById(`cluster-${c.id}`);

  if (!el) return;

  // ✅ This zooms perfectly to the dot
  ref.zoomToElement(el, 1.8, 300);

  setSelectedCluster(c);
}, []);


  /* ==========================
     RENDER
  ========================== */

  const mapHeightCss = fullscreen
    ? "calc(100vh - 220px)"
    : desktop
    ? "520px"
    : "260px";

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
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: fullscreen ? 28 : 20, fontWeight: 950, letterSpacing: -0.4, color: "#0f172a" }}>
              Live Visitors
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#64748b", fontWeight: 700 }}>
              Real-time activity map • built for bot spikes
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <StatCard label="TOTAL RIGHT NOW" value={totals.totalVisitors.toLocaleString()} />
            <StatCard label="ACTIVE LOCATIONS" value={clusters.length.toLocaleString()} />
          </div>
        </div>

        {/* Filters row */}
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 260px", minWidth: 220 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, state, page key, or URL…"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                outline: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#111827",
                background: "white",
              }}
            />
          </div>

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
          <Pill
            label={`Partner (${totals.byCat.partner})`}
            color={COLORS.partner}
            active={show.partner}
            onClick={() => setShow((s) => ({ ...s, partner: !s.partner }))}
          />
          <Pill
  label={`Coverage (${totals.byCat.partner_coverage})`}
  color={COLORS.partner_coverage}
  active={show.partner_coverage}
  onClick={() =>
    setShow((s) => ({
      ...s,
      partner_coverage: !s.partner_coverage,
    }))
  }
/>

          <Pill
            label={`Other (${totals.byCat.other})`}
            color={COLORS.other}
            active={show.other}
            onClick={() => setShow((s) => ({ ...s, other: !s.other }))}
          />
          <Pill
  label={`Crawlers (${totals.byCat.crawler})`}
  color={COLORS.crawler}
  active={show.crawler}
  onClick={() => setShow((s) => ({ ...s, crawler: !s.crawler }))}
/>


          <button
            onClick={resetView}
            style={{
              marginLeft: "auto",
              border: "1px solid #e5e7eb",
              background: "white",
              padding: "10px 12px",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              color: "#0f172a",
            }}
          >
            Reset View
          </button>
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
          background: "#f8fafc",
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
              ref={(ref) => {
                // assign to ref without returning a value to satisfy Ref callback type
                zoomRef.current = ref;
              }}
              initialScale={1.15}
              minScale={1}
              maxScale={6}
              wheel={{ step: 0.25 }}
              doubleClick={{ disabled: true }}
              onTransformed={(ref) => setZoomScale(ref.state.scale)}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: "block", background: "#f8fafc" }}
                >
                  <defs>
                    <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8f2ff" />
                      <stop offset="100%" stopColor="#f8fafc" />
                    </linearGradient>

                    <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f7fafc" />
                      <stop offset="100%" stopColor="#eef2f7" />
                    </linearGradient>

                    <filter id="mapSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
                    </filter>

                    <filter id="bubbleShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#0f172a" floodOpacity="0.22" />
                    </filter>

                    <filter id="hoverGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="2.2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Ocean */}
                  <rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#oceanGrad)" />

                  {/* Coastline */}
                  <path
                    d={pathGenerator(nation) || ""}
                    fill="url(#landGrad)"
                    stroke="#334155"
                    strokeWidth={2}
                    filter="url(#mapSoftShadow)"
                  />

                  {/* States */}
                  <g filter="url(#mapSoftShadow)">
                    {states.map((state: any, i: number) => {
                      const fips = String(state.id).padStart(2, "0");
                      const isHover = hoveredStateKey === fips;

                      return (
                        <path
                          key={i}
                          d={pathGenerator(state) || ""}
                          fill={isHover ? "#ffe5e5" : "url(#landGrad)"}
                          stroke={isHover ? "#334155" : "#475569"}
                          strokeWidth={isHover ? 2.2 : 1.4}
                          style={{ transition: "all 120ms ease", cursor: "default" }}
                          filter={isHover ? "url(#hoverGlow)" : undefined}
                          onMouseEnter={() => setHoveredStateKey(fips)}
                          onMouseLeave={() => setHoveredStateKey(null)}
                        />
                      );
                    })}
                  </g>

                  {/* State labels */}
                  <g style={{ pointerEvents: "none" }}>
                    {stateLabels.map((l) => {
                      const labelOpacity = zoomScale > 3.2 ? 0.12 : zoomScale > 2.2 ? 0.18 : 0.28;
                      return (
                        <text
                          key={l.key}
                          x={l.x}
                          y={l.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={zoomScale > 2.2 ? 9 : 10}
                          fontWeight={900}
                          fill="#0f172a"
                          opacity={labelOpacity}
                          style={{ letterSpacing: "0.6px", textShadow: "0 1px 0 rgba(255,255,255,0.65)" }}
                        >
                          {l.abbr}
                        </text>
                      );
                    })}
                  </g>

                  {/* Clusters */}
                  {clusters
  .slice()
  .sort((a, b) => {
    // ✅ Crawlers always render underneath
    if (a.category === "crawler" && b.category !== "crawler") return -1;
    if (a.category !== "crawler" && b.category === "crawler") return 1;
    return b.total - a.total;
  })
  .map((c) => {
                    const safeCount = safeInt(c.total, 1);
                    const radius =
  c.category === "crawler"
    ? clamp(6 + Math.log10(safeCount + 1) * 8, 6, 18)
    : clamp(10 + Math.sqrt(safeCount) * 6, 10, 52);

                    const dotColor = COLORS[c.category];

                    return (
                      <g
                        id={`cluster-${c.id}`}
                         key={c.id}
                         style={{ cursor: "pointer" }}
                        filter="url(#bubbleShadow)"
                        onMouseEnter={() => setHoverCluster(c)}
                        onMouseLeave={() => setHoverCluster((prev) => (prev?.id === c.id ? null : prev))}
                        onClick={() => {
                          setSelectedCluster(c);
                        }}
                      >
                       {/* Pulse ring (humans only) */}
{c.category !== "crawler" && c.category !== "partner_coverage" && (
  <circle
    cx={c.x}
    cy={c.y}
    r={radius + 6}
    fill="none"
    stroke={dotColor}
    strokeWidth={2.6}
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
)}
{/* ======================================================
   COVERAGE CLUSTER (SUBTLE WATERMARK STYLE)
====================================================== */}

{/* Soft halo glow */}
{c.category === "partner_coverage" && (
  <circle
    cx={c.x}
    cy={c.y}
    r={radius + 10}
    fill={dotColor}
    opacity={0.05}
  />
)}

{/* Main Coverage Outline Bubble */}
<circle
  cx={c.x}
  cy={c.y}
  r={radius}
  fill={c.category === "partner_coverage" ? "transparent" : dotColor}
  stroke={c.category === "partner_coverage" ? dotColor : "none"}
  strokeWidth={c.category === "partner_coverage" ? 1.6 : 0}
  opacity={
    c.category === "crawler"
      ? 0.50
      : c.category === "partner_coverage"
      ? 0.25
      : 0.92
  }
/>

{/* Icon/Text */}
<text
  x={c.x}
  y={c.y + 4}
  textAnchor="middle"
  fontWeight="900"
  fontSize={
    c.category === "partner_coverage"
      ? 16   // ✅ bigger dot
      : c.category === "crawler"
      ? 14
      : 14
  }
  fill={
    c.category === "partner_coverage"
      ? "#f59e0b" // ✅ strong amber
      : c.category === "crawler"
      ? "white"
      : "white"
  }
  opacity={
    c.category === "partner_coverage"
      ? 0.85 // ✅ visible but subtle
      : 1
  }
>
  {c.category === "crawler"
    ? "🕷"
    : c.category === "partner_coverage"
    ? "●"
    : safeCount.toString()}
</text>





                        {/* Label (zoom in) */}
                        {zoomScale > 2.2 && (
                          <text
                            x={c.x}
                            y={c.y + radius + 18}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="900"
                            fill="#111827"
                          >
                            {c.topLabel}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Hover tooltip */}
          {hoverCluster && !selectedCluster && (
            <div
              style={{
                position: "absolute",
                right: 22,
                top: 22,
                width: 280,
                background: "rgba(255,255,255,0.96)",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                padding: 12,
                pointerEvents: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 950, color: "#0f172a" }}>{hoverCluster.topLabel}</div>
                <div style={{ fontWeight: 950, color: COLORS[hoverCluster.category] }}>
                  {hoverCluster.total.toLocaleString()}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#475569", fontWeight: 700 }}>
                {hoverCluster.items.length} event{hoverCluster.items.length === 1 ? "" : "s"} in this cluster
              </div>
            </div>
          )}

          {/* Selected drawer */}
          {selectedCluster && (
            <div
              style={{
                position: fullscreen ? "absolute" : "relative",
                marginTop: fullscreen ? 0 : 14,
                left: fullscreen ? 18 : "auto",
                bottom: fullscreen ? 18 : "auto",
                width: fullscreen ? 420 : "100%",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
                padding: 14,
                zIndex: 50,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 950, color: "#0f172a" }}>{selectedCluster.topLabel}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                    Cluster total: {selectedCluster.total.toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => zoomToCluster(selectedCluster)}
                    style={{
                      border: "1px solid #e5e7eb",
                      background: "white",
                      padding: "9px 10px",
                      borderRadius: 14,
                      fontWeight: 900,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Zoom Here
                  </button>

                  <button
                    onClick={() => setSelectedCluster(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 18,
                      cursor: "pointer",
                      color: "#6b7280",
                      padding: "4px 8px",
                    }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {uniqueItems
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((it) => (

                    <div
                      key={it.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: "10px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 13 }}>
  {it.category === "crawler"
    ? `🕷 ${it.crawler_name || "Crawler"} • ${it.state}`
    : `${it.city}, ${it.state}`}
</div>


                        <div
  style={{
    marginTop: 2,
    fontSize: 12,
    color: "#475569",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
>
  {it.page_url || "Unknown URL"}
</div>

                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 950, color: COLORS[it.category] }}>{it.count}</div>
                        {it.page_url && (
                          <a
                            href={`https://doorplaceusa.com${it.page_url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: brandRed, fontWeight: 950, textDecoration: "underline", fontSize: 12 }}
                          >
                            Open
                          </a>
                        )}
                      </div>
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
            <span>Scroll / pinch to zoom • spikes throttled (250ms)</span>
            <span>{clusters.length.toLocaleString()} clustered locations</span>
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
