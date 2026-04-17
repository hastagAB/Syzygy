"use client";

import TransitMap from "@/components/map";
import SearchPanel from "@/components/search/SearchPanel";
import ResultsList from "@/components/results/ResultsList";

export default function Home() {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col overflow-y-auto border-r border-gray-800 bg-gray-900 md:w-96">
        <SearchPanel />
        <div className="border-t border-gray-800">
          <ResultsList />
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1">
        <TransitMap />
      </main>
    </div>
  );
}
