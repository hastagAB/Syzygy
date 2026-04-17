import { describe, it, expect } from "vitest";
import { useSearchStore } from "@/lib/store/search-store";

describe("search store", () => {
  it("should_initialize_with_defaults", () => {
    const state = useSearchStore.getState();
    expect(state.location).toBeNull();
    expect(state.radiusKm).toBe(100);
    expect(state.selectedSatellites).toEqual([25544]);
    expect(state.selectedTargets).toEqual(["sun", "moon"]);
    expect(state.isSearching).toBe(false);
    expect(state.transits).toEqual([]);
  });

  it("should_set_location", () => {
    useSearchStore.getState().setLocation({ lat: 45.46, lon: 9.19 }, "Milan");
    const state = useSearchStore.getState();
    expect(state.location).toEqual({ lat: 45.46, lon: 9.19 });
    expect(state.locationName).toBe("Milan");
  });

  it("should_set_radius", () => {
    useSearchStore.getState().setRadiusKm(200);
    expect(useSearchStore.getState().radiusKm).toBe(200);
  });

  it("should_set_results_and_clear", () => {
    useSearchStore.getState().setResults([], null, 123);
    expect(useSearchStore.getState().computeTimeMs).toBe(123);

    useSearchStore.getState().clearResults();
    expect(useSearchStore.getState().transits).toEqual([]);
    expect(useSearchStore.getState().computeTimeMs).toBeNull();
  });
});
