"use client";

import TransitMap from "@/components/map";
import SearchPanel from "@/components/search/SearchPanel";
import ResultsList from "@/components/results/ResultsList";
import { useSearchStore } from "@/lib/store/search-store";

export default function Home() {
  const isSearching = useSearchStore((s) => s.isSearching);

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col overflow-y-auto border-r border-gray-800/50 bg-gray-900/95 backdrop-blur-sm md:w-[420px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-gray-900 to-gray-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-black">
              S
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Syzygy</h1>
              <p className="text-xs text-indigo-300/70">Satellite Transit Finder</p>
            </div>
          </div>
        </div>

        <SearchPanel />

        <div className="border-t border-gray-800/50">
          <ResultsList />
        </div>

        {/* Footer disclaimer */}
        <div className="mt-auto border-t border-gray-800/50 px-4 py-3">
          <p className="text-[10px] leading-relaxed text-gray-600">
            Predictions based on SGP4 orbital propagation. Accuracy depends on TLE freshness. Always
            verify with transit-finder.com before traveling. Weather conditions not accounted for.
          </p>
        </div>
      </aside>

      {/* Map */}
      <main className="relative flex-1">
        <TransitMap />
        {isSearching && (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-900/90 px-8 py-6 shadow-2xl">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-500" />
                <div
                  className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-amber-500"
                  style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
              </div>
              <p className="text-sm font-medium text-gray-300">Scanning orbital paths...</p>
              <p className="text-xs text-gray-500">This may take 5-30 seconds</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
