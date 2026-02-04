"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GeneratedPagesTable from "../../components/GeneratedPagesTable";

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
  { value: "red-oak", label: "Red Oak Wood" },
  { value: "white-oak", label: "White Oak Wood" },
  { value: "cypress", label: "Cypress Wood" },
  { value: "pressure-treated", label: "Pressure-Treated Wood" },
  { value: "stained-wood", label: "Stained Wood" },
  { value: "painted-wood", label: "Painted Wood" },
  { value: "natural-wood", label: "Natural Wood" },
  { value: "marine-grade", label: "Marine-Grade Wood" },
];


const SWING_STYLE_OPTIONS = [
  // Bed / Size Styles
  { value: "daybed-porch-swings", label: "Daybed Porch Swings" },
  { value: "bed-style-porch-swings", label: "Bed-Style Porch Swings" },
  { value: "crib-porch-swings", label: "Crib Porch Swings" },
  { value: "twin-bed-porch-swings", label: "Twin Bed Porch Swings" },
  { value: "full-bed-porch-swings", label: "Full Bed Porch Swings" },
  { value: "queen-bed-porch-swings", label: "Queen Bed Porch Swings" },
  { value: "king-bed-porch-swings", label: "King Bed Porch Swings" },
  { value: "extra-wide-porch-swings", label: "Extra-Wide Porch Swings" },

  // Location / Property
  { value: "front-porch-swings", label: "Front Porch Swings" },
  { value: "back-porch-swings", label: "Back Porch Swings" },
  { value: "backyard-swings", label: "Backyard Swings" },
  { value: "patio-swings", label: "Patio Swings" },
  { value: "garden-swings", label: "Garden Swings" },
  { value: "poolside-swings", label: "Poolside Swings" },
  { value: "lake-house-porch-swings", label: "Lake House Porch Swings" },
  { value: "beach-house-porch-swings", label: "Beach House Porch Swings" },
  { value: "cabin-porch-swings", label: "Cabin Porch Swings" },

  // Mounting / Structure
  { value: "pergola-swings", label: "Pergola Swings" },
  { value: "gazebo-swings", label: "Gazebo Swings" },
  { value: "hanging-porch-swings", label: "Hanging Porch Swings" },
  { value: "ceiling-mounted-porch-swings", label: "Ceiling-Mounted Porch Swings" },
  { value: "beam-mounted-porch-swings", label: "Beam-Mounted Porch Swings" },
  { value: "a-frame-porch-swings", label: "A-Frame Porch Swings" },
  { value: "freestanding-porch-swings", label: "Freestanding Porch Swings" },
  { value: "stand-mounted-porch-swings", label: "Stand-Mounted Porch Swings" },

  // Hardware / Hanging
  { value: "porch-swings-with-chains", label: "Porch Swings with Chains" },
  { value: "porch-swings-with-ropes", label: "Porch Swings with Ropes" },
  { value: "adjustable-height-porch-swings", label: "Adjustable-Height Porch Swings" },
  { value: "quiet-swing-porch-swings", label: "Quiet-Swing Porch Swings" },
  { value: "hidden-hardware-porch-swings", label: "Hidden-Hardware Porch Swings" },

  // Design Styles
  { value: "farmhouse-porch-swings", label: "Farmhouse Porch Swings" },
  { value: "modern-porch-swings", label: "Modern Porch Swings" },
  { value: "modern-farmhouse-porch-swings", label: "Modern Farmhouse Porch Swings" },
  { value: "traditional-porch-swings", label: "Traditional Porch Swings" },
  { value: "rustic-porch-swings", label: "Rustic Porch Swings" },
  { value: "country-porch-swings", label: "Country Porch Swings" },
  { value: "luxury-porch-swings", label: "Luxury Porch Swings" },
  { value: "minimalist-porch-swings", label: "Minimalist Porch Swings" },
  { value: "contemporary-porch-swings", label: "Contemporary Porch Swings" },

  // Comfort / Use Case
  { value: "lounging-porch-swings", label: "Lounging Porch Swings" },
  { value: "reading-porch-swings", label: "Reading Porch Swings" },
  { value: "family-size-porch-swings", label: "Family-Size Porch Swings" },
  { value: "couples-porch-swings", label: "Couples Porch Swings" },
  { value: "deep-seat-porch-swings", label: "Deep-Seat Porch Swings" },
  { value: "adult-porch-swings", label: "Adult Porch Swings" },

  // Build / Strength
  { value: "handcrafted-porch-swings", label: "Handcrafted Porch Swings" },
  { value: "custom-porch-swings", label: "Custom Porch Swings" },
  { value: "heavy-duty-porch-swings", label: "Heavy-Duty Porch Swings" },
  { value: "oversized-porch-swings", label: "Oversized Porch Swings" },
  { value: "reinforced-porch-swings", label: "Reinforced Porch Swings" },
  { value: "high-weight-capacity-porch-swings", label: "High Weight Capacity Porch Swings" },

  // Finish / Durability
  { value: "weather-resistant-porch-swings", label: "Weather-Resistant Porch Swings" },
  { value: "outdoor-rated-porch-swings", label: "Outdoor-Rated Porch Swings" },
  { value: "sealed-wood-porch-swings", label: "Sealed Wood Porch Swings" },
  { value: "solid-wood-porch-swings", label: "Solid Wood Porch Swings" },

  // Premium / Sales Drivers
  { value: "made-to-order-porch-swings", label: "Made-to-Order Porch Swings" },
  { value: "built-to-last-porch-swings", label: "Built-to-Last Porch Swings" },
  { value: "USA-made-porch-swings", label: "USA-Made Porch Swings" },
];


const DOOR_STYLE_OPTIONS = [
  { value: "single-barn-doors", label: "Single Barn Doors" },
  { value: "double-barn-doors", label: "Double Barn Doors" },
  { value: "bypass-barn-doors", label: "Bypass Barn Doors" },
  { value: "bifold-barn-doors", label: "Bifold Barn Doors" },
  { value: "glass-barn-doors", label: "Glass Barn Doors" },
  { value: "mirror-barn-doors", label: "Mirror Barn Doors" },
  { value: "rustic-barn-doors", label: "Rustic Barn Doors" },
  { value: "modern-barn-doors", label: "Modern Barn Doors" },
  { value: "custom-barn-doors", label: "Custom Barn Doors" },
];

const INSTALL_MOUNT_OPTIONS = [
  { value: "ceiling-mounted", label: "Ceiling Mounted" },
  { value: "beam-mounted", label: "Beam Mounted" },
  { value: "pergola", label: "Pergola / Gazebo" },
  { value: "freestanding", label: "Freestanding / A-Frame" },
];





const TEMPLATE_OPTIONS = [
  /* =========================================
     CORE PORCH SWING
  ========================================= */

  { value: "porch_swing_city", label: "Porch Swing – City" },
  { value: "porch_swing_delivery", label: "Porch Swing – Delivery (City)" },

  /* =========================================
     INSTALLATION
  ========================================= */

  { value: "porch_swing_installation_city", label: "Porch Swing – Installation (City)" },
  { value: "porch_swing_installation_process_city", label: "Porch Swing – Installation Process (City)" },
  { value: "porch_swing_mount_type_city", label: "Porch Swing – Mount Type (City)" },

  /* =========================================
     COST CLUSTER
  ========================================= */

  { value: "porch_swing_cost_city", label: "Porch Swing – Cost (City)" },
  { value: "porch_swing_cost_factors_city", label: "Porch Swing – Cost Factors (City)" },
  { value: "porch_swing_installed_cost_city", label: "Porch Swing – Installed Cost (City)" },
  { value: "porch_swing_cost_by_size_city", label: "Porch Swing – Cost by Size (City)" },
  { value: "porch_swing_vs_daybed_cost_city", label: "Porch Swing vs Daybed – Cost (City)" },
  { value: "porch_swing_vs_rocker_cost_city", label: "Porch Swing vs Rocker – Cost (City)" },

  /* =========================================
     SIZE & FIT
  ========================================= */

  { value: "porch_swing_size_city", label: "Porch Swing – Size (City)" },
  { value: "porch_swing_size_fit_city", label: "Porch Swing – Size Fit (City)" },
  { value: "porch_swing_clearance_city", label: "Porch Swing – Clearance (City)" },
  { value: "porch_swing_ceiling_height_city", label: "Porch Swing – Ceiling Height (City)" },
  { value: "porch_swing_chain_spacing_city", label: "Porch Swing – Chain Spacing (City)" },
  { value: "porch_swing_width_city", label: "Porch Swing – Width (City)" },
  { value: "porch_swing_depth_city", label: "Porch Swing – Depth (City)" },
  { value: "what_size_porch_swing_city", label: "What Size Porch Swing? (City)" },

  /* =========================================
     MATERIAL / STYLE / USE CASE
  ========================================= */

  { value: "porch_swing_material_city", label: "Porch Swing – Material (City)" },
  { value: "porch_swing_style_city", label: "Porch Swing – Style (City)" },
  { value: "porch_swing_usecase_city", label: "Porch Swing – Use Case (City)" },
  { value: "porch_swing_small_porch_city", label: "Porch Swing – Small Porch (City)" },

  /* =========================================
     DIY / HARDWARE / PRO
  ========================================= */

  { value: "porch_swing_diy_city", label: "Porch Swing – DIY vs Pro (City)" },
  { value: "porch_swing_hardware_city", label: "Porch Swing – Hardware (City)" },
  { value: "porch_swing_hire_pro_city", label: "Porch Swing – Hire a Pro (City)" },
  { value: "porch_swing_weight_capacity_city", label: "Porch Swing – Weight Capacity (City)" },

  /* =========================================
     DOORS
  ========================================= */

  { value: "door_city", label: "Barn Door Style – City" },
  { value: "custom_door_installation_city", label: "Custom Door Installation – City" },
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
  const [selectedMountType, setSelectedMountType] = useState("ceiling-mounted");

  const [progressText, setProgressText] = useState<string>("");
  const [isPushingToShopify, setIsPushingToShopify] = useState(false);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState(
  DOOR_STYLE_OPTIONS[0].value
);




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
      return { pageType, size: selectedSwingSize };

    case "material":
      return { pageType, material: selectedSwingMaterial };

    case "style":
      return { pageType, style: selectedSwingStyle };

    case "install":
      return { pageType, mountType: selectedMountType };


    case "door":
      if (selectedTemplate === "door_city") {
        return { pageType, style: selectedDoorStyle };
      }

      // ✅ custom_door_installation_city → NO variant params
      return { pageType };

    default:
      return { pageType };
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
    case "custom_door_installation_city":
      return "door";
    case "porch_swing_installation_city":
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

const selectAllCitiesAllStates = async () => {
  showToast("info", "Selecting all cities across all states…");

  try {
    const res = await fetch("/api/locations/select-all");
    const json = await res.json();

    if (!res.ok) throw new Error(json.error);

    setSelectedCityIds(new Set(json.city_ids));
    showToast("success", `Selected ${json.city_ids.length} cities`);
  } catch (e: any) {
    showToast("error", e.message);
  }
};





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
    <div className="h-[calc(110vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-325 w-full mx-auto">
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

{selectedTemplate === "door_city" && (
  <div>
    <label className="block text-sm font-semibold mb-2">
      Barn Door Style
    </label>
    <select
      value={selectedDoorStyle}
      onChange={(e) => setSelectedDoorStyle(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    >
      {DOOR_STYLE_OPTIONS.map((d) => (
        <option key={d.value} value={d.value}>
          {d.label}
        </option>
      ))}
    </select>
  </div>
)}

{selectedTemplate === "porch_swing_installation_city" && (
  <div>
    <label className="block text-sm font-semibold mb-2">
      Installation Mount Type
    </label>
    <select
      value={selectedMountType}
      onChange={(e) => setSelectedMountType(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    >
      {INSTALL_MOUNT_OPTIONS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
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

  <div className="flex flex-wrap gap-3">
    <button
      onClick={selectAllVisible}
      className="text-sm underline"
    >
      Select All (Visible)
    </button>

    <button
      onClick={selectAllCitiesAllStates}
      className="text-sm underline font-semibold text-red-700"
    >
      Select ALL Cities (All States)
    </button>

    <button
      onClick={clearSelection}
      className="text-sm underline"
    >
      Clear
    </button>
  </div>
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



<GeneratedPagesTable />

    </div>
  );
}
