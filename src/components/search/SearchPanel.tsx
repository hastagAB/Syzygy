"use client";

import { useState } from "react";
import { useSearchStore } from "@/lib/store/search-store";
import { SATELLITE_CATALOG } from "@/lib/data/satellite-catalog";

const SAT_ICONS: Record<string, string> = {
  "ISS (ZARYA)": "🛰️",
  HST: "🔭",
  "CSS (TIANHE)": "🏗️",
};

export default function SearchPanel() {
  const {
    location,
    locationName,
    dateRange,
    radiusKm,
    selectedSatellites,
    selectedTargets,
    isSearching,
    error,
    setLocation,
    setLocationName,
    setDateRange,
    setRadiusKm,
    setSelectedSatellites,
    setSelectedTargets,
    setSearching,
    setError,
    setResults,
  } = useSearchStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  async function handleGeocode() {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `/api/v1/geocode?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error.message);
        return;
      }
      setLocation({ lat: data.lat, lon: data.lon }, data.displayName);
      setLocationName(data.displayName);
    } catch {
      setError("Failed to geocode location");
    }
  }

  async function handleGeolocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(loc);
        try {
          const res = await fetch(
            `/api/v1/geocode?lat=${loc.lat}&lon=${loc.lon}`,
          );
          const data = await res.json();
          if (!data.error) {
            setLocationName(data.displayName);
          }
        } catch {
          // Reverse geocode is best-effort
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError("Unable to get your location");
        setIsLocating(false);
      },
    );
  }

  async function handleSearch() {
    if (!location) {
      setError("Please set a location first");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/transits/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          dateRange: {
            start: new Date(dateRange.start).toISOString(),
            end: new Date(dateRange.end).toISOString(),
          },
          radiusKm,
          satellites: selectedSatellites,
          targets: selectedTargets,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error.message);
        return;
      }

      setResults(data.transits ?? [], data.suggestions ?? null, data.meta?.computeTimeMs ?? 0);
    } catch {
      setError("Search request failed");
    } finally {
      setSearching(false);
    }
  }

  const rangeDays = Math.round(
    (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) /
      (86400000),
  );

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      {/* Location */}
      <section>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Location
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
              placeholder="Search city or address..."
              className="w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-indigo-500 focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <button
            onClick={handleGeocode}
            className="rounded-lg bg-indigo-600 px-4 text-sm font-medium transition-all hover:bg-indigo-500 active:scale-95"
          >
            Go
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleGeolocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-xs text-indigo-400 transition-colors hover:text-indigo-300 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
            {isLocating ? "Locating..." : "Use my location"}
          </button>
          {locationName && (
            <span className="truncate text-xs text-gray-500">{locationName}</span>
          )}
        </div>
      </section>

      {/* Date Range */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Date Range
          </label>
          <span className="text-xs text-gray-600">{rangeDays} days</span>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(e.target.value, dateRange.end)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 transition-colors focus:border-indigo-500 focus:outline-none"
          />
          <span className="flex items-center text-xs text-gray-600">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(dateRange.start, e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 transition-colors focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Radius */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Travel Radius
          </label>
          <span className="rounded-md bg-indigo-950 px-2 py-0.5 text-xs font-bold text-indigo-400">
            {radiusKm} km
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-gray-600">
          <span>10 km</span>
          <span>250 km</span>
          <span>500 km</span>
        </div>
      </section>

      {/* Satellites & Targets in a compact row */}
      <section className="flex gap-4">
        <div className="flex-1">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Satellites
          </label>
          <div className="flex flex-col gap-1.5">
            {SATELLITE_CATALOG.map((sat) => (
              <label
                key={sat.noradId}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                  selectedSatellites.includes(sat.noradId)
                    ? "border-indigo-500/50 bg-indigo-950/50"
                    : "border-gray-800 bg-gray-800/30 hover:border-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSatellites.includes(sat.noradId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSatellites([...selectedSatellites, sat.noradId]);
                    } else {
                      setSelectedSatellites(
                        selectedSatellites.filter((id) => id !== sat.noradId),
                      );
                    }
                  }}
                  className="sr-only"
                />
                <span>{SAT_ICONS[sat.name] ?? "🛰️"}</span>
                <span className="text-gray-300">{sat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-24">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Target
          </label>
          <div className="flex flex-col gap-1.5">
            {(["sun", "moon"] as const).map((target) => (
              <label
                key={target}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                  selectedTargets.includes(target)
                    ? target === "sun"
                      ? "border-amber-500/50 bg-amber-950/50"
                      : "border-slate-400/50 bg-slate-900/50"
                    : "border-gray-800 bg-gray-800/30 hover:border-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTargets.includes(target)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTargets([...selectedTargets, target]);
                    } else {
                      setSelectedTargets(
                        selectedTargets.filter((t) => t !== target),
                      );
                    }
                  }}
                  className="sr-only"
                />
                <span>{target === "sun" ? "☀️" : "🌙"}</span>
                <span className="capitalize text-gray-300">{target}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isSearching || !location}
        className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-sm font-bold uppercase tracking-wider transition-all hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="relative z-10">
          {isSearching ? "Scanning..." : "Find Transits"}
        </span>
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2.5">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
