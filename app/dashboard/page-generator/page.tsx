"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Page Generator (Mobile-first)
 * TradePilot Fishing Hooks
 */

type StateRow = {
  id: string;
  state_name: string;
  state_code: string;
};

type CityRow = {
  id: string;
  city_name: string;
  slug: string;
  population: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

const brandRed = "#b80d0d";

const FishOnHookIcon = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v9a4 4 0 1 0 4 4" />
    <path d="M12 3V1" />
    <path d="M5 14c2-1 4-1 6 0-2 2-4 2-6 0z" />
    <path d="M5 14l-2-2m2 2l-2 2" />
    <circle cx="8" cy="13" r="0.5" />
  </svg>
);

const SWING_SIZE_OPTIONS = [
  { value: "crib", label: "Crib Size" },
  { value: "twin", label: "Twin Size" },
  { value: "full", label: "Full Size" },
  { value: "custom", label: "Custom Size" },
];

const SWING_MATERIAL_OPTIONS = [
  { value: "pine", label: "Pine Wood" },
  { value: "cedar", label: "Cedar Wood" },
  { value: "oak", label: "Oak Wood" },
  { value: "Red Oak Wood", label: "Red Oak Wood" },
  { value: "White Oak Wood", label: "White Oak Wood" },
  { value: "cypress", label: "Cypress Wood" },
  { value: "pressure-treated", label: "Pressure Treated" },
];

const SWING_STYLE_OPTIONS = [
  { value: "daybed-porch-swings", label: "Daybed Porch Swings" },
  { value: "farmhouse-porch-swings", label: "Farmhouse Porch Swings" },
  { value: "patio-swings", label: "Patio Swings" },
  { value: "pergola-swings", label: "Pergola Swings" },
  { value: "backyard-swings", label: "Backyard Swings" },
  { value: "front-yard-swings", label: "Front Yard Swings" },

  { value: "luxury-porch-swings", label: "Luxury Porch Swings" },
  { value: "modern-porch-swings", label: "Modern Porch Swings" },
  { value: "traditional-porch-swings", label: "Traditional Porch Swings" },
  { value: "rustic-porch-swings", label: "Rustic Porch Swings" },
  { value: "country-porch-swings", label: "Country Porch Swings" },

  { value: "custom-porch-swings", label: "Custom Porch Swings" },
  { value: "handcrafted-porch-swings", label: "Handcrafted Porch Swings" },
  { value: "heavy-duty-porch-swings", label: "Heavy-Duty Porch Swings" },
  { value: "oversized-porch-swings", label: "Oversized Porch Swings" },

  { value: "gazebo-swings", label: "Gazebo Swings" },
  { value: "garden-swings", label: "Garden Swings" },
  { value: "poolside-swings", label: "Poolside Swings" },

  { value: "porch-swings-with-chains", label: "Porch Swings with Chains" },
  { value: "hanging-porch-swings", label: "Hanging Porch Swings" },
];



const TEMPLATE_OPTIONS = [
  // Core swing pages
  { value: "porch_swing_city", label: "Porch Swing – City" },
  { value: "porch_swing_delivery", label: "Porch Swing – Delivery (City)" },

  // 🔥 Variant swing pages
  { value: "porch_swing_size_city", label: "Porch Swing – Size (City)" },
  { value: "porch_swing_usecase_city", label: "Porch Swing – Use Case (City)" },
  { value: "porch_swing_material_city", label: "Porch Swing – Material (City)" },
  { value: "porch_swing_style_city", label: "Porch Swing – Style (City)" },

  // Doors (DFW only)
  { value: "door_city", label: "Door – City (DFW)" },
];



export default function PageGeneratorAdminPage() {
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkGeneratedIds, setBulkGeneratedIds] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);


  const [selectedSwingSize, setSelectedSwingSize] = useState("crib");
  
  const [selectedSwingMaterial, setSelectedSwingMaterial] = useState("cedar");
  const [selectedSwingStyle, setSelectedSwingStyle] = useState(
  SWING_STYLE_OPTIONS[0].value
);



  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCityIds, setSelectedCityIds] = useState<Set<string>>(new Set());
  const [radiusCenterId, setRadiusCenterId] = useState<string>("");
  const [radiusMiles, setRadiusMiles] = useState<number>(25);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>("");
  const [isPushingToShopify, setIsPushingToShopify] = useState(false);



  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    TEMPLATE_OPTIONS[0].value
  );

  // 🔥 NEW
  const [sortMode, setSortMode] = useState<"population" | "name">("population");
  const listRef = useRef<HTMLUListElement | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);

const getTemplateParams = () => {
  const pageType = getPageTypeFromTemplate(selectedTemplate);

  switch (pageType) {
    case "size":
      return {
        pageType,
        size: selectedSwingSize,
      };

    case "material":
      return {
        pageType,
        material: selectedSwingMaterial,
      };

    case "style":
      return {
        pageType,
        style: selectedSwingStyle,
      };

    default:
      return {
        pageType,
      };
  }
};




const getPageTypeFromTemplate = (template: string) => {
  switch (template) {
    case "porch_swing_material_city":
      return "material";
    case "porch_swing_size_city":
      return "size";
    case "porch_swing_style_city":
      return "style";
    case "door_city":
      return "door";
    case "porch_swing_delivery":
      return "install";
    default:
      return "general";
  }
};



  function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 🔥 Sorted + filtered list
  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = q
      ? cities.filter(
          (c) =>
            c.city_name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q)
        )
      : [...cities];

    if (sortMode === "name") {
      list.sort((a, b) => a.city_name.localeCompare(b.city_name));
    } else {
      list.sort((a, b) => (b.population || 0) - (a.population || 0));
    }

    return list;
  }, [cities, search, sortMode]);

  // 🔥 Auto-jump when typing
  useEffect(() => {
    if (!search || !listRef.current) return;

    const match = filteredCities.find((c) =>
      c.city_name.toLowerCase().startsWith(search.toLowerCase())
    );
    if (!match) return;

    const el = document.getElementById(`city-${match.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [search, filteredCities]);

  const visibleCityIds = useMemo(
    () => new Set(filteredCities.map((c) => c.id)),
    [filteredCities]
  );

  const selectAllVisible = () => {
    const next = new Set(selectedCityIds);
    visibleCityIds.forEach((id) => next.add(id));
    setSelectedCityIds(next);
  };

  const clearSelection = () => setSelectedCityIds(new Set());

  const toggleCity = (id: string) => {
    const next = new Set(selectedCityIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedCityIds(next);
  };

 

  const showToast = (type: any, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const run = async () => {
      setLoadingStates(true);
      const { data } = await supabase
        .from("us_states")
        .select("id,state_name,state_code")
        .order("state_name", { ascending: true });

      setStates(data || []);
      setLoadingStates(false);

      if (!selectedStateId && data?.length) setSelectedStateId(data[0].id);
    };
    run();
  }, []);


useEffect(() => {
  if (!jobId) return;

  const interval = setInterval(async () => {
    const res = await fetch(`/api/pages/job-status?job_id=${jobId}`);
    const job = await res.json();

    setProgressText(
      `Batch ${job.last_batch} of ${Math.ceil(
        job.total / 150
      )} completed — ${job.processed} / ${job.total} pages`
    );

    if (job.status === "completed") {
  setJobId(null);
  clearInterval(interval);
  showToast("success", "All pages generated — ready to push");
}


    if (job.status === "failed") {
      clearInterval(interval);
      setJobId(null);
      showToast("error", "Generation failed");
    }
  }, 1500);

  return () => clearInterval(interval);
}, [jobId]);



  useEffect(() => {
  if (!selectedStateId) return;

  const run = async () => {
    setLoadingCities(true);
    clearSelection();

    let allCities: CityRow[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `/api/locations/cities?state_id=${selectedStateId}&page=${page}`
      );
      const json = await res.json();
      const batch = json.cities || [];

      allCities = allCities.concat(batch);

      if (batch.length < 1000) {
        hasMore = false; // last page reached
      } else {
        page++;
      }
    }

    setCities(allCities);
    setLoadingCities(false);
  };

  run();
}, [selectedStateId]);

useEffect(() => {
  const loadPendingCount = async () => {
    const { count } = await supabase
      .from("generated_pages")
      .select("id", { count: "exact", head: true })
      .is("shopify_page_id", null)
      .in("status", ["generated"]);

    setPendingCount(count || 0);
  };

  loadPendingCount();
}, []);




  const selectCitiesInRadius = (centerCityId: string, miles: number) => {
    const center = cities.find((c) => c.id === centerCityId);
    if (!center?.latitude || !center.longitude) return;

    const next = new Set<string>();
    cities.forEach((c) => {
      if (!c.latitude || !c.longitude) return;
      const d = haversineMiles(
        center.latitude!,
        center.longitude!,
        c.latitude!,
        c.longitude!
      );
      if (d <= miles) next.add(c.id);
    });
    setSelectedCityIds(next);
  };

 return (
    <div className="h-[calc(110vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-[1300px] w-full mx-auto">
      <div className="w-full px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fishing Hooks</h1>
            <p className="mt-1 text-sm text-gray-600">
              Pick a state → select cities → generate draft pages.
            </p>
          </div>

          <div className="flex items-center justify-center rounded-full border bg-white p-2 shadow-sm">
            <FishOnHookIcon size={28} />
          </div>
        </div>

        {toast && (
          <div
            className={[
              "mb-4 rounded-lg px-4 py-3 text-sm border",
              toast.type === "success" && "bg-green-50 border-green-200 text-green-900",
              toast.type === "error" && "bg-red-50 border-red-200 text-red-900",
              toast.type === "info" && "bg-gray-50 border-gray-200 text-gray-900",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* LEFT PANEL */}
          <div className="rounded-xl border bg-white p-4 md:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">State</label>
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.state_name} ({s.state_code})
                  </option>
                ))}
              </select>
            </div>

           <div>
  <label className="block text-sm font-semibold mb-2">Template</label>
  <select
    value={selectedTemplate}
    onChange={(e) => setSelectedTemplate(e.target.value)}
    className="w-full rounded-lg border px-3 py-2 text-sm"
  >
    {TEMPLATE_OPTIONS.map((t) => (
      <option key={t.value} value={t.value}>
        {t.label}
      </option>
    ))}
  </select>
</div>

{/* 🔥 CONDITIONAL SWING SIZE DROPDOWN */}
{selectedTemplate === "porch_swing_size_city" && (
  <div>
    <label className="block text-sm font-semibold mb-2">
      Swing Size
    </label>
    <select
      value={selectedSwingSize}
      onChange={(e) => setSelectedSwingSize(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    >
      {SWING_SIZE_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  </div>
)}

{selectedTemplate === "porch_swing_material_city" && (
  <div>
    <label className="block text-sm font-semibold mb-2">
      Swing Material
    </label>
    <select
      value={selectedSwingMaterial}
      onChange={(e) => setSelectedSwingMaterial(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    >
      {SWING_MATERIAL_OPTIONS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  </div>
)}

{selectedTemplate === "porch_swing_style_city" && (
  <div>
    <label className="block text-sm font-semibold mb-2">
      Porch Swing Style
    </label>
    <select
      value={selectedSwingStyle}
      onChange={(e) => setSelectedSwingStyle(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    >
      {SWING_STYLE_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  </div>
)}




            <div>
              <label className="block text-sm font-semibold mb-2">
                Hero Image URL (optional)
              </label>
              <input
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="text-sm mb-3">
                Selected: <strong>{selectedCityIds.size}</strong>
              </div>

              <button
                onClick={selectAllVisible}
                className="text-sm underline mr-3"
              >
                Select All (Visible)
              </button>
              <button onClick={clearSelection} className="text-sm underline">
                Clear
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="rounded-xl border bg-white p-4 md:col-span-2">
            <div className="flex gap-2 mb-3">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="population">Sort by Population</option>
                <option value="name">Sort A–Z</option>
              </select>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city…"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2 mb-3">
              <select
                value={radiusCenterId}
                onChange={(e) => setRadiusCenterId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Center City</option>
                {filteredCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city_name}
                  </option>
                ))}
              </select>

              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
                <option value={100}>100 miles</option>
              </select>

              <button
                onClick={() => selectCitiesInRadius(radiusCenterId, radiusMiles)}
                className="bg-black text-white px-4 rounded"
              >
                Apply Radius
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto border rounded">
              <ul ref={listRef}>
                {filteredCities.map((c) => (
                  <li
                    id={`city-${c.id}`}
                    key={c.id}
                    className="flex justify-between px-3 py-2 border-b hover:bg-gray-50"
                  >
                    <label className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCityIds.has(c.id)}
                        onChange={() => toggleCity(c.id)}
                      />
                      {c.city_name}
                    </label>
                    <span className="text-xs">
                      {c.population?.toLocaleString() || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

           <div className="mt-4 flex flex-col gap-2">

            













{pendingCount !== null && (
  <button
    disabled={pendingCount === 0 || isPushingToShopify}
    onClick={async () => {
      setIsPushingToShopify(true);
      showToast(
        "info",
        `Publishing ${pendingCount} pending page${pendingCount === 1 ? "" : "s"}…`
      );

      try {
        const res = await fetch("/api/pages/push-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        showToast("success", "Pending pages publish started");
      } catch (e: any) {
        showToast("error", e.message);
        setIsPushingToShopify(false);
      }
    }}
    className={`px-4 py-2 rounded text-white transition-all
      ${
        pendingCount === 0 || isPushingToShopify
          ? "bg-gray-400 opacity-60 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
  >
    {pendingCount === 0
      ? "No Pending Pages"
      : `Publish Pending Pages (${pendingCount})`}
  </button>
)}



            {selectedCityIds.size > 0 && (
  <div className="text-sm text-gray-700">
    You are about to generate{" "}
    <strong>{selectedCityIds.size}</strong>{" "}
    page{selectedCityIds.size === 1 ? "" : "s"}.
  </div>
)}

{progressText && (
  <div className="text-sm font-semibold text-blue-700">
    {progressText}
  </div>
)}


              


              <button
                onClick={async () => {
                  if (!selectedStateId || selectedCityIds.size === 0) {
                    showToast("info", "Select cities first");
                    return;
                  }
                  setIsGenerating(true);
                  try {
                    const res = await fetch("/api/pages/generate-job", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    state_id: selectedStateId,
    city_ids: Array.from(selectedCityIds),
    page_template: selectedTemplate,
    hero_image_url: heroImageUrl || null,
    ...getTemplateParams(), // 👈 includes pageType automatically
  }),
});



                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error);

                    setJobId(json.job_id);
setProgressText("Starting generation...");
showToast("info", "Generation started");

                  } catch (e: any) {
                    showToast("error", e.message);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Generate Pages
              </button>

          




            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
