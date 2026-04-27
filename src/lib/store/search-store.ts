import { create } from "zustand";
import type { LatLon } from "@/types";
import type { TransitTarget, TransitEvent, SearchSuggestions } from "@/types/transit";

export interface SearchState {
  // Location
  location: LatLon | null;
  locationName: string;

  // Search params
  dateRange: { start: string; end: string };
  radiusKm: number;
  selectedSatellites: number[];
  selectedTargets: TransitTarget[];

  // Search status
  isSearching: boolean;
  error: string | null;

  // Results
  transits: TransitEvent[];
  suggestions: SearchSuggestions | null;
  computeTimeMs: number | null;

  // UI state
  selectedTransitId: string | null;

  // Actions
  setLocation: (location: LatLon, name?: string) => void;
  setLocationName: (name: string) => void;
  setDateRange: (start: string, end: string) => void;
  setRadiusKm: (km: number) => void;
  setSelectedSatellites: (ids: number[]) => void;
  setSelectedTargets: (targets: TransitTarget[]) => void;
  setSearching: (searching: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (
    transits: TransitEvent[],
    suggestions: SearchSuggestions | null,
    computeTimeMs: number,
  ) => void;
  clearResults: () => void;
  selectTransit: (id: string | null) => void;
}

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    start: now.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export const useSearchStore = create<SearchState>((set) => ({
  location: null,
  locationName: "",
  dateRange: getDefaultDateRange(),
  radiusKm: 100,
  selectedSatellites: [25544],
  selectedTargets: ["sun", "moon"],
  isSearching: false,
  error: null,
  transits: [],
  suggestions: null,
  computeTimeMs: null,
  selectedTransitId: null,

  setLocation: (location, name) => set({ location, locationName: name ?? "" }),
  setLocationName: (name) => set({ locationName: name }),
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  setRadiusKm: (km) => set({ radiusKm: km }),
  setSelectedSatellites: (ids) => set({ selectedSatellites: ids }),
  setSelectedTargets: (targets) => set({ selectedTargets: targets }),
  setSearching: (searching) => set({ isSearching: searching }),
  setError: (error) => set({ error }),
  setResults: (transits, suggestions, computeTimeMs) =>
    set({ transits, suggestions, computeTimeMs }),
  clearResults: () =>
    set({ transits: [], suggestions: null, computeTimeMs: null, selectedTransitId: null }),
  selectTransit: (id) => set({ selectedTransitId: id }),
}));
