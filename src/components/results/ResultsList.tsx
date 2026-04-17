"use client";

import { useSearchStore } from "@/lib/store/search-store";
import type { TransitEvent } from "@/types/transit";

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function TransitCard({ event }: { event: TransitEvent }) {
  const selectTransit = useSearchStore((s) => s.selectTransit);
  const selectedId = useSearchStore((s) => s.selectedTransitId);
  const isSelected = selectedId === event.id;

  const time = typeof event.time.utc === "string"
    ? new Date(event.time.utc)
    : event.time.utc;

  return (
    <button
      onClick={() => selectTransit(isSelected ? null : event.id)}
      className={`w-full rounded border p-3 text-left transition-colors ${
        isSelected
          ? "border-indigo-500 bg-indigo-950"
          : "border-gray-700 bg-gray-800 hover:border-gray-600"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-100">{event.satellite.name}</span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold ${
            event.target === "sun"
              ? "bg-amber-900 text-amber-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {event.target === "sun" ? "Solar" : "Lunar"}
        </span>
      </div>

      <p className="mt-1 text-sm text-gray-400">{formatTime(time)}</p>

      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span>Duration: {event.time.durationMs}ms</span>
        <span>Quality: {event.quality.score}/100</span>
      </div>

      <div className="mt-1 text-xs text-gray-500">
        Target alt: {event.targetBody.altitudeDeg.toFixed(1)} -
        {event.targetBody.azimuthDeg.toFixed(1)} az
      </div>

      {isSelected && (
        <div className="mt-3 border-t border-gray-700 pt-3 text-xs text-gray-400">
          <p>Min separation: {event.minSeparationArcsec.toFixed(1)}&quot;</p>
          <p>
            Satellite angular size: {event.satellite.angularDiameterArcsec.toFixed(1)}&quot;
          </p>
          <p>
            Target angular size: {event.targetBody.angularDiameterArcsec.toFixed(1)}&quot;
          </p>
          <p>
            Corridor width: {event.groundTrack.corridorWidthKm.toFixed(1)} km
          </p>
          <p className="mt-1 font-medium text-indigo-400">{event.quality.notes}</p>
        </div>
      )}
    </button>
  );
}

export default function ResultsList() {
  const transits = useSearchStore((s) => s.transits);
  const suggestions = useSearchStore((s) => s.suggestions);
  const computeTimeMs = useSearchStore((s) => s.computeTimeMs);
  const isSearching = useSearchStore((s) => s.isSearching);

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p>Scanning orbital paths...</p>
      </div>
    );
  }

  if (computeTimeMs === null) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Set a location and search to find satellite transits.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {transits.length} transit{transits.length !== 1 ? "s" : ""} found
        </span>
        <span>{computeTimeMs}ms</span>
      </div>

      {transits.length === 0 && suggestions && (
        <div className="rounded border border-amber-800 bg-amber-950 p-3 text-sm">
          <p className="font-medium text-amber-300">No transits found</p>
          <p className="mt-1 text-amber-400">
            Satellite transits are rare events. Try these suggestions:
          </p>
          <ul className="mt-2 list-inside list-disc text-amber-400">
            {suggestions.increaseRadius && (
              <li>
                Increase travel radius to {suggestions.increaseRadius.suggestedKm} km
              </li>
            )}
            {suggestions.extendDateRange && (
              <li>Extend date range to cover more time</li>
            )}
          </ul>
        </div>
      )}

      {transits.map((event) => (
        <TransitCard key={event.id} event={event} />
      ))}
    </div>
  );
}
