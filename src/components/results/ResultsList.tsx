"use client";

import { useState, useMemo } from "react";
import { useSearchStore } from "@/lib/store/search-store";
import type { TransitEvent } from "@/types/transit";

type SortKey = "date" | "quality" | "distance" | "duration";
type FilterTarget = "all" | "sun" | "moon";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSec}s`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatCountdown(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return "Past";
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  if (days > 0) return `in ${days}d ${hours}h`;
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `in ${hours}h ${minutes}m`;
}

function compassDirection(azDeg: number): string {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const idx = Math.round(azDeg / 22.5) % 16;
  return dirs[idx];
}

function qualityColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-orange-400";
}

function qualityBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-950/50 border-emerald-500/30";
  if (score >= 50) return "bg-amber-950/50 border-amber-500/30";
  return "bg-orange-950/50 border-orange-500/30";
}

function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

function TransitCard({ event, rank }: { event: TransitEvent; rank: number }) {
  const selectTransit = useSearchStore((s) => s.selectTransit);
  const selectedId = useSearchStore((s) => s.selectedTransitId);
  const isSelected = selectedId === event.id;

  const time = typeof event.time.utc === "string" ? new Date(event.time.utc) : event.time.utc;

  const isSolar = event.target === "sun";

  return (
    <div
      onClick={() => selectTransit(isSelected ? null : event.id)}
      className={`cursor-pointer rounded-xl border transition-all duration-200 ${
        isSelected
          ? isSolar
            ? "border-amber-500/50 bg-gray-800/80 shadow-lg shadow-amber-500/5"
            : "border-slate-500/50 bg-gray-800/80 shadow-lg shadow-slate-500/5"
          : "border-gray-800/50 bg-gray-800/30 hover:border-gray-700 hover:bg-gray-800/50"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start gap-3 px-4 pt-3">
        {/* Rank Badge */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isSolar ? "bg-amber-900/60 text-amber-300" : "bg-slate-800 text-slate-300"
          }`}
        >
          #{rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-100">{event.satellite.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isSolar ? "bg-amber-900/60 text-amber-300" : "bg-slate-800 text-slate-300"
              }`}
            >
              {isSolar ? "☀️ Solar" : "🌙 Lunar"}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
            <span>{formatDate(time)}</span>
            <span className="text-gray-600">|</span>
            <span className="font-mono">{formatTime(time)} UTC</span>
          </div>
        </div>

        {/* Quality Badge */}
        <div
          className={`shrink-0 rounded-lg border px-2 py-1 text-center ${qualityBgColor(event.quality.score)}`}
        >
          <div className={`text-lg font-black leading-none ${qualityColor(event.quality.score)}`}>
            {event.quality.score}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-gray-500">score</div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="mt-3 grid grid-cols-3 gap-1 px-4">
        <div className="rounded-lg bg-gray-900/50 px-2 py-1.5 text-center">
          <div className="text-sm font-bold text-white">
            {formatDuration(event.time.durationMs)}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">Duration</div>
        </div>
        <div className="rounded-lg bg-gray-900/50 px-2 py-1.5 text-center">
          <div className="text-sm font-bold text-white">
            {event.observationPoint.distanceFromUserKm.toFixed(0)} km
          </div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">Distance</div>
        </div>
        <div className="rounded-lg bg-gray-900/50 px-2 py-1.5 text-center">
          <div className="text-sm font-bold text-white">{formatCountdown(time)}</div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">When</div>
        </div>
      </div>

      {/* Look Direction */}
      <div className="mt-2 flex items-center gap-3 px-4 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg
            className="h-3.5 w-3.5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 2l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" />
          </svg>
          Look {compassDirection(event.targetBody.azimuthDeg)},{" "}
          {event.targetBody.altitudeDeg.toFixed(0)} above horizon
        </div>
      </div>

      {/* Expanded Details */}
      {isSelected && (
        <div className="border-t border-gray-700/50 px-4 pb-4 pt-3">
          {/* Transit Timeline */}
          <div className="mb-3 rounded-lg bg-gray-900/50 p-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Transit Timeline
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-gray-400">{formatTime(event.time.entryUtc)}</span>
              <div className="flex-1">
                <div
                  className={`h-1.5 rounded-full ${isSolar ? "bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" : "bg-gradient-to-r from-slate-700 via-slate-400 to-slate-700"}`}
                />
              </div>
              <span className="font-mono text-gray-400">{formatTime(event.time.exitUtc)}</span>
            </div>
            <div className="mt-1 text-center text-xs font-medium text-gray-300">
              {formatDuration(event.time.durationMs)} total crossing time
            </div>
          </div>

          {/* Technical Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Min separation</span>
              <span className="font-mono text-gray-300">
                {event.minSeparationArcsec.toFixed(1)}&quot;
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sat. angular size</span>
              <span className="font-mono text-gray-300">
                {event.satellite.angularDiameterArcsec.toFixed(1)}&quot;
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target angular size</span>
              <span className="font-mono text-gray-300">
                {event.targetBody.angularDiameterArcsec.toFixed(0)}&quot;
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Corridor width</span>
              <span className="font-mono text-gray-300">
                {event.groundTrack.corridorWidthKm.toFixed(1)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target altitude</span>
              <span className="font-mono text-gray-300">
                {event.targetBody.altitudeDeg.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target azimuth</span>
              <span className="font-mono text-gray-300">
                {event.targetBody.azimuthDeg.toFixed(1)} (
                {compassDirection(event.targetBody.azimuthDeg)})
              </span>
            </div>
          </div>

          <p className={`mt-2 text-xs font-medium ${qualityColor(event.quality.score)}`}>
            {event.quality.notes}
          </p>

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            <a
              href={googleMapsUrl(event.observationPoint.lat, event.observationPoint.lon)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
              Navigate in Google Maps
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const text = `${event.satellite.name} ${isSolar ? "solar" : "lunar"} transit on ${formatDate(time)} at ${formatTime(time)} UTC. Duration: ${formatDuration(event.time.durationMs)}. Look ${compassDirection(event.targetBody.azimuthDeg)} at ${event.targetBody.altitudeDeg.toFixed(0)} alt. Obs. point: ${event.observationPoint.lat.toFixed(4)}, ${event.observationPoint.lon.toFixed(4)}`;
                navigator.clipboard.writeText(text);
              }}
              className="flex items-center justify-center rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsList() {
  const transits = useSearchStore((s) => s.transits);
  const suggestions = useSearchStore((s) => s.suggestions);
  const computeTimeMs = useSearchStore((s) => s.computeTimeMs);
  const isSearching = useSearchStore((s) => s.isSearching);

  const [sortBy, setSortBy] = useState<SortKey>("quality");
  const [filterTarget, setFilterTarget] = useState<FilterTarget>("all");

  const filteredAndSorted = useMemo(() => {
    let filtered = transits;
    if (filterTarget !== "all") {
      filtered = transits.filter((t) => t.target === filterTarget);
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => {
          const ta =
            typeof a.time.utc === "string" ? new Date(a.time.utc).getTime() : a.time.utc.getTime();
          const tb =
            typeof b.time.utc === "string" ? new Date(b.time.utc).getTime() : b.time.utc.getTime();
          return ta - tb;
        });
        break;
      case "quality":
        sorted.sort((a, b) => b.quality.score - a.quality.score);
        break;
      case "distance":
        sorted.sort(
          (a, b) => a.observationPoint.distanceFromUserKm - b.observationPoint.distanceFromUserKm,
        );
        break;
      case "duration":
        sorted.sort((a, b) => b.time.durationMs - a.time.durationMs);
        break;
    }
    return sorted;
  }, [transits, sortBy, filterTarget]);

  if (isSearching) {
    return null; // Loading is shown as an overlay on the map now
  }

  if (computeTimeMs === null) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="rounded-full bg-gray-800/50 p-4">
          <svg
            className="h-8 w-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          Set a location and search to find satellite transits
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Results Header with Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">
            {filteredAndSorted.length} transit{filteredAndSorted.length !== 1 ? "s" : ""}
            {filterTarget !== "all" && (
              <span className="ml-1 text-xs font-normal text-gray-500">({filterTarget})</span>
            )}
          </span>
          <span className="text-[10px] text-gray-600">
            {(computeTimeMs / 1000).toFixed(1)}s compute
          </span>
        </div>

        {transits.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Target Filter */}
            <div className="flex rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
              {(["all", "sun", "moon"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterTarget(f)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                    filterTarget === f
                      ? "bg-gray-700 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {f === "all" ? "All" : f === "sun" ? "☀️" : "🌙"}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-200 focus:outline-none"
            >
              <option value="quality">Best quality</option>
              <option value="date">Soonest</option>
              <option value="distance">Nearest</option>
              <option value="duration">Longest</option>
            </select>
          </div>
        )}
      </div>

      {/* No Results */}
      {transits.length === 0 && suggestions && (
        <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔭</span>
            <p className="font-medium text-amber-300">No transits found</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-400/80">
            Satellite transits are rare events - the ISS transit path is only ~4km wide. Try these
            suggestions:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-400/70">
            {suggestions.increaseRadius && (
              <li className="flex items-center gap-1.5">
                <span>-</span>
                Increase travel radius to {suggestions.increaseRadius.suggestedKm} km
              </li>
            )}
            {suggestions.extendDateRange && (
              <li className="flex items-center gap-1.5">
                <span>-</span>
                Extend the date range to cover more time
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <span>-</span>
              Enable all three satellites (ISS, HST, Tiangong)
            </li>
            <li className="flex items-center gap-1.5">
              <span>-</span>
              Search for both solar and lunar transits
            </li>
          </ul>
        </div>
      )}

      {/* Transit Cards */}
      {filteredAndSorted.map((event, i) => (
        <TransitCard key={event.id} event={event} rank={i + 1} />
      ))}
    </div>
  );
}
