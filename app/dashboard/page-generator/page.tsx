"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Page Generator (Mobile-first)
 *
 * ✅ Fixes "too wide" mobile layout:
 * - Uses max-width container + padding
 * - Uses grid that collapses to 1 column on mobile
 * - Ensures panels don't overflow horizontally
 *
 * NOTE:
 * This page expects these tables:
 * - us_states: (id, state_name, state_code)
 * - us_locations: (id, state_id, city_name, slug, population)
 *
 * And it calls these API routes (change these if your routes differ):
 * - POST /api/page-generator/generate-single
 * - POST /api/page-generator/generate-bulk
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
};

const brandRed = "#b80d0d";

const TEMPLATE_OPTIONS = [
  { value: "porch_swing_city", label: "Porch Swing City Page" },
  { value: "door_city", label: "Door City Page" },
];

export default function PageGeneratorAdminPage() {
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkGeneratedIds, setBulkGeneratedIds] = useState<string[]>([]);


  const [lastGeneratedPage, setLastGeneratedPage] = useState<{
  id: string;
  title: string;
  slug: string;
  status: string;
} | null>(null);


  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [heroImageUrl, setHeroImageUrl] = useState("");


  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATE_OPTIONS[0].value);

  const [search, setSearch] = useState("");
  const [selectedCityIds, setSelectedCityIds] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(
    null
  );

  // ----- helpers -----
  const selectedCount = selectedCityIds.size;

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.city_name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [cities, search]);

  const visibleCityIds = useMemo(() => new Set(filteredCities.map((c) => c.id)), [filteredCities]);

  const selectAllVisible = () => {
    const next = new Set(selectedCityIds);
    for (const id of visibleCityIds) next.add(id);
    setSelectedCityIds(next);
  };

  const clearSelection = () => setSelectedCityIds(new Set());

  const toggleCity = (id: string) => {
    const next = new Set(selectedCityIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCityIds(next);
  };

  const firstSelectedCityId = useMemo(() => {
    const arr = Array.from(selectedCityIds);
    return arr.length ? arr[0] : null;
  }, [selectedCityIds]);

  const showToast = (type: "success" | "error" | "info", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  // ----- data fetching -----
  useEffect(() => {
    const run = async () => {
      setLoadingStates(true);
      const { data, error } = await supabase
        .from("us_states")
        .select("id,state_name,state_code")
        .order("state_name", { ascending: true });

      setLoadingStates(false);

      if (error) {
        showToast("error", `States load failed: ${error.message}`);
        return;
      }

      const rows = (data ?? []) as StateRow[];
      setStates(rows);

      // auto-select first state if none selected
      if (!selectedStateId && rows.length) {
        setSelectedStateId(rows[0].id);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  if (!selectedStateId) return;

  const run = async () => {
    setLoadingCities(true);
    setCities([]);
    clearSelection();

    try {
      const res = await fetch(
        `/api/locations/cities?state_id=${selectedStateId}`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load cities");
      }

      setCities(json.cities ?? []);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load cities");
    } finally {
      setLoadingCities(false);
    }
  };

  run();
}, [selectedStateId]);


  // ----- actions -----
  const handleGenerateSingle = async () => {
    if (!selectedStateId || !firstSelectedCityId) {
      showToast("info", "Select at least 1 city first.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/pages/generate-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  state_id: selectedStateId,
  location_id: firstSelectedCityId,
  page_template: selectedTemplate,
  hero_image_url: heroImageUrl || null,
}),

      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Generate single failed.");

      
setLastGeneratedPage({
  id: json.page.id,
  title: json.page.title,
  slug: json.page.slug,
  status: json.page.status,
});


showToast("success", "Draft page created.");

    } catch (e: any) {
      showToast("error", e?.message || "Generate single failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedStateId || selectedCount === 0) {
      showToast("info", "Select cities first.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/pages/generate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  state_id: selectedStateId,
  city_ids: Array.from(selectedCityIds),
  page_template: selectedTemplate,
  hero_image_url: heroImageUrl || null,
}),

      });

      const json = await res.json().catch(() => ({}));
if (!res.ok) throw new Error(json?.error || "Bulk generate failed.");

setBulkGeneratedIds(json.page_ids || []);

showToast("success", `Generated ${json.page_ids?.length || selectedCount} draft pages.`);

    } catch (e: any) {
      showToast("error", e?.message || "Bulk generate failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[calc(110vh-80px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-[1300px] w-full mx-auto">
    
      {/* top container */}
      <div className="w-full px-6 py-6">
        <div className="mb-5">
          <h1 className="text-3xl font-bold">Page Generator</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pick a state → select cities → generate draft pages.
          </p>
        </div>

        {/* toast */}
        {toast && (
          <div
            className={[
              "mb-4 rounded-lg px-4 py-3 text-sm border",
              toast.type === "success" ? "bg-green-50 border-green-200 text-green-900" : "",
              toast.type === "error" ? "bg-red-50 border-red-200 text-red-900" : "",
              toast.type === "info" ? "bg-gray-50 border-gray-200 text-gray-900" : "",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        )}

        {/* grid (mobile-first) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* left panel */}
          <div className="rounded-xl border bg-white p-4 md:col-span-1">
            <div className="space-y-4">
              {/* state */}
              <div>
                <label className="block text-sm font-semibold mb-2">State</label>
                <select
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  disabled={loadingStates}
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.state_name} ({s.state_code})
                    </option>
                  ))}
                </select>
                {loadingStates && <div className="mt-2 text-xs text-gray-500">Loading states…</div>}
              </div>

              {/* template */}
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

{/* hero image */}
<div>
  <label className="block text-sm font-semibold mb-2">
    Hero Image URL (optional)
  </label>
  <input
    type="text"
    value={heroImageUrl}
    onChange={(e) => setHeroImageUrl(e.target.value)}
    placeholder="https://cdn.shopify.com/..."
    className="w-full rounded-lg border px-3 py-2 text-sm"
  />
  <div className="mt-1 text-xs text-gray-500">
    Displays at the top of the page (SEO-friendly)
  </div>
</div>



              {/* actions */}
              <div className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm text-gray-700 mb-3">
                  Selected: <span className="font-semibold">{selectedCount}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleGenerateSingle}
                    disabled={isGenerating || selectedCount === 0}
                    className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Generate 1 Page
                  </button>

                  <button
                    onClick={handleBulkGenerate}
                    disabled={isGenerating || selectedCount === 0}
                    style={{ backgroundColor: brandRed }}
                    className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Bulk Generate {selectedCount}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="underline text-gray-700"
                    disabled={filteredCities.length === 0}
                  >
                    Select All (Visible)
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="underline text-gray-700"
                    disabled={selectedCount === 0}
                  >
                    Clear
                  </button>
                </div>

                {isGenerating && <div className="mt-2 text-xs text-gray-500">Working…</div>}
              </div>
            </div>
          </div>

          {/* right panel */}
          <div className="rounded-xl border bg-white p-4 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Cities (by population)</div>
                <div className="text-xs text-gray-500">
                  {loadingCities ? "Loading…" : `${cities.length} loaded`}
                </div>
              </div>

              <div className="w-full sm:max-w-xs">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city…"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              {/* list */}
              <div className="max-h-[62vh] overflow-y-auto rounded-lg border">
                {loadingCities ? (
                  <div className="p-4 text-sm text-gray-600">Loading cities…</div>
                ) : filteredCities.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">No cities found.</div>
                ) : (
                  <ul className="divide-y">
                    {filteredCities.map((c) => {
                      const checked = selectedCityIds.has(c.id);
                      return (
                        <li
                          key={c.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCity(c.id)}
                            className="h-4 w-4"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{c.city_name}</div>
                            <div className="truncate text-xs text-gray-500">{c.slug}</div>
                          </div>

                          <div className="shrink-0 text-xs text-gray-500">
                            {c.population ? c.population.toLocaleString() : "—"}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Tip: On mobile, use Search + Select All (Visible) to build batches fast.
              </div>
            </div>
          </div>
        </div>
      </div>


{lastGeneratedPage && (
  <div className="mt-6 rounded-xl border bg-white p-4">
    <div className="text-sm font-semibold mb-1">
      Latest Generated Draft
    </div>

    <div className="text-sm text-gray-700">
      <div><strong>Title:</strong> {lastGeneratedPage.title}</div>
      <div><strong>Slug:</strong> {lastGeneratedPage.slug}</div>
      <div><strong>Status:</strong> {lastGeneratedPage.status}</div>
    </div>

    <div className="mt-3 flex gap-2">
      <button
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        onClick={() =>
          window.open(`/preview/page/${lastGeneratedPage.id}`, "_blank")
        }
      >
        View Draft
      </button>

      <button
  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
  style={{ backgroundColor: brandRed }}
  onClick={async () => {
    if (!lastGeneratedPage?.id) return;

    try {
      setIsGenerating(true);

      const res = await fetch("/api/push-to-shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: lastGeneratedPage.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Push failed");
      }

      showToast("success", "Page published to Shopify 🎉");
    } catch (err: any) {
      showToast("error", err.message || "Publish failed");
    } finally {
      setIsGenerating(false);
    }
  }}
>
  Push to Shopify
</button>

    </div>
  </div>
)}
{bulkGeneratedIds.length > 0 && (
  <div className="mt-6 rounded-xl border bg-white p-4">
    <div className="text-sm font-semibold mb-1">
      Bulk Generated Drafts
    </div>

    <div className="text-sm text-gray-700 mb-3">
      {bulkGeneratedIds.length} pages ready to publish
    </div>

    <button
      className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
      style={{ backgroundColor: brandRed }}
      disabled={isGenerating}
      onClick={async () => {
        try {
          setIsGenerating(true);

          const res = await fetch("/api/pages/push-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page_ids: bulkGeneratedIds,
            }),
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "Bulk push failed");
          }

          showToast("success", `Published ${bulkGeneratedIds.length} pages to Shopify 🎉`);
          setBulkGeneratedIds([]);
        } catch (err: any) {
          showToast("error", err.message || "Bulk publish failed");
        } finally {
          setIsGenerating(false);
        }
      }}
    >
      Push {bulkGeneratedIds.length} Pages to Shopify
    </button>
  </div>
)}






    </div>
  );
}
