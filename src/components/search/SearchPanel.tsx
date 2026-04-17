"use client";

import { useState } from "react";
import { useSearchStore } from "@/lib/store/search-store";
import { SATELLITE_CATALOG } from "@/lib/data/satellite-catalog";

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
        }
      },
      () => setError("Unable to get your location"),
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-indigo-400">Syzygy</h1>
      <p className="text-sm text-gray-400">Satellite Transit Finder</p>

      {/* Location */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
            placeholder="Search city or address..."
            className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleGeocode}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            Go
          </button>
        </div>
        <button
          onClick={handleGeolocation}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Use my location
        </button>
        {locationName && (
          <p className="text-xs text-gray-400">{locationName}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Date Range</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(e.target.value, dateRange.end)}
            className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(dateRange.start, e.target.value)}
            className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">
          Travel Radius: {radiusKm} km
        </label>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>10 km</span>
          <span>500 km</span>
        </div>
      </div>

      {/* Satellites */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Satellites</label>
        <div className="flex flex-col gap-1">
          {SATELLITE_CATALOG.map((sat) => (
            <label key={sat.noradId} className="flex items-center gap-2 text-sm">
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
                className="rounded accent-indigo-500"
              />
              <span className="text-gray-300">{sat.name}</span>
              <span
                className={`text-xs ${
                  sat.difficulty === "easy"
                    ? "text-green-400"
                    : sat.difficulty === "medium"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                ({sat.difficulty})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Targets */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Transit Type</label>
        <div className="flex gap-4">
          {(["sun", "moon"] as const).map((target) => (
            <label key={target} className="flex items-center gap-2 text-sm">
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
                className="rounded accent-indigo-500"
              />
              <span className="text-gray-300 capitalize">{target}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isSearching || !location}
        className="mt-2 rounded bg-indigo-600 py-3 text-sm font-bold uppercase tracking-wide hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSearching ? "Searching..." : "Find Transits"}
      </button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
