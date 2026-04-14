import { describe, it, expect } from "vitest";
import { searchTransits } from "@/lib/engine/search-orchestrator";
import { ISS_TLE_FIXTURE, HST_TLE_FIXTURE } from "../../fixtures/tle-fixtures";

const MILAN = { lat: 45.4642, lon: 9.19 };

describe("searchTransits", () => {
  it("should_orchestrate_full_search_pipeline", () => {
    const result = searchTransits({
      observer: MILAN,
      dateRange: {
        start: new Date("2024-02-14T06:00:00Z"),
        end: new Date("2024-02-15T18:00:00Z"),
      },
      radiusKm: 50,
      satellites: [
        {
          noradId: 25544,
          name: "ISS (ZARYA)",
          line1: ISS_TLE_FIXTURE.line1,
          line2: ISS_TLE_FIXTURE.line2,
          sizeMeters: 109,
        },
      ],
      targets: ["sun", "moon"],
    });

    expect(result.meta.location).toEqual(MILAN);
    expect(result.meta.radiusKm).toBe(50);
    expect(result.meta.computeTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.transits).toBeDefined();
    expect(Array.isArray(result.transits)).toBe(true);
  });

  it("should_return_empty_results_with_suggestions_for_short_range", () => {
    const result = searchTransits({
      observer: MILAN,
      dateRange: {
        start: new Date("2024-02-14T22:00:00Z"),
        end: new Date("2024-02-15T04:00:00Z"),
      },
      radiusKm: 10,
      satellites: [
        {
          noradId: 25544,
          name: "ISS (ZARYA)",
          line1: ISS_TLE_FIXTURE.line1,
          line2: ISS_TLE_FIXTURE.line2,
          sizeMeters: 109,
        },
      ],
      targets: ["sun"],
    });

    // Nighttime solar search with tiny radius - no transits expected
    expect(result.transits).toHaveLength(0);
    // Should suggest extending date range or radius
    expect(result.suggestions).not.toBeNull();
  });

  it("should_handle_multiple_satellites", () => {
    const result = searchTransits({
      observer: MILAN,
      dateRange: {
        start: new Date("2024-02-14T08:00:00Z"),
        end: new Date("2024-02-14T16:00:00Z"),
      },
      radiusKm: 50,
      satellites: [
        {
          noradId: 25544,
          name: "ISS (ZARYA)",
          line1: ISS_TLE_FIXTURE.line1,
          line2: ISS_TLE_FIXTURE.line2,
          sizeMeters: 109,
        },
        {
          noradId: 20580,
          name: "HST",
          line1: HST_TLE_FIXTURE.line1,
          line2: HST_TLE_FIXTURE.line2,
          sizeMeters: 13.2,
        },
      ],
      targets: ["sun"],
    });

    expect(result.meta.location).toEqual(MILAN);
    expect(result.transits).toBeDefined();
  });
});
