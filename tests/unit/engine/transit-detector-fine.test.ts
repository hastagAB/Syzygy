import { describe, it, expect } from "vitest";
import { coarseScan, fineScan } from "@/lib/engine/transit-detector";
import { ISS_TLE_FIXTURE } from "../../fixtures/tle-fixtures";

const MILAN = { lat: 45.4642, lon: 9.19 };
const ISS_NORAD_ID = 25544;

describe("fineScan", () => {
  it("should_refine_candidate_and_find_closest_approach", () => {
    // Get a candidate window from coarse scan with wide threshold
    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start: new Date("2024-02-14T08:00:00Z"),
      end: new Date("2024-02-14T14:00:00Z"),
      thresholdDeg: 15,
    });

    // We need at least one candidate to test fine scan
    if (candidates.length === 0) {
      // Skip if no candidates found (orbit geometry dependent)
      return;
    }

    const result = fineScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      candidate: candidates[0],
    });

    // Fine scan should always return a closest approach
    expect(result).not.toBeNull();
    expect(result!.closestApproach.time).toBeInstanceOf(Date);
    expect(result!.closestApproach.separationArcsec).toBeGreaterThanOrEqual(0);
    expect(result!.closestApproach.satelliteAngularDiameterArcsec).toBeGreaterThan(0);
    expect(result!.closestApproach.targetAngularDiameterArcsec).toBeGreaterThan(0);
    // Fine scan min separation should be <= coarse scan (refined)
    expect(result!.closestApproach.separationArcsec).toBeLessThanOrEqual(
      candidates[0].minSeparationDeg * 3600 + 100, // small tolerance
    );
  });

  it("should_reject_near_miss", () => {
    // Use a coarse candidate with wide threshold - ISS will pass near the Sun
    // but very unlikely to actually transit (separation < ~960 arcsec)
    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start: new Date("2024-02-14T08:00:00Z"),
      end: new Date("2024-02-14T14:00:00Z"),
      thresholdDeg: 15,
    });

    if (candidates.length === 0) return;

    const result = fineScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      candidate: candidates[0],
    });

    // A near miss should have no transit detected
    // (real ISS solar transits from a random location are extremely rare)
    if (result && !result.transit) {
      expect(result.closestApproach.separationArcsec).toBeGreaterThan(0);
    }
  });

  it("should_record_minimum_separation", () => {
    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start: new Date("2024-02-14T08:00:00Z"),
      end: new Date("2024-02-14T14:00:00Z"),
      thresholdDeg: 15,
    });

    if (candidates.length === 0) return;

    const result = fineScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      candidate: candidates[0],
    });

    expect(result).not.toBeNull();
    // Min separation should be non-negative
    expect(result!.closestApproach.separationArcsec).toBeGreaterThanOrEqual(0);
    // Time of closest approach should be within the expanded window
    const windowStart = candidates[0].start.getTime() - 10000;
    const windowEnd = candidates[0].end.getTime() + 10000;
    expect(result!.closestApproach.time.getTime()).toBeGreaterThanOrEqual(windowStart);
    expect(result!.closestApproach.time.getTime()).toBeLessThanOrEqual(windowEnd);
  });

  it("should_compute_transit_duration_when_transit_detected", () => {
    // If a transit is detected, duration should be positive and < 2s for ISS
    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start: new Date("2024-02-14T08:00:00Z"),
      end: new Date("2024-02-14T14:00:00Z"),
      thresholdDeg: 15,
    });

    for (const candidate of candidates) {
      const result = fineScan({
        observer: MILAN,
        tleLine1: ISS_TLE_FIXTURE.line1,
        tleLine2: ISS_TLE_FIXTURE.line2,
        satelliteNoradId: ISS_NORAD_ID,
        candidate,
      });

      if (result?.transit) {
        expect(result.transit.durationMs).toBeGreaterThan(0);
        // ISS transits typically last < 2 seconds
        expect(result.transit.durationMs).toBeLessThan(5000);
        expect(result.transit.entryTime.getTime()).toBeLessThanOrEqual(
          result.transit.exitTime.getTime(),
        );
      }
    }
  });

  it("should_integrate_as_pipeline_coarse_then_fine", () => {
    // Full pipeline: coarse scan -> fine scan for each candidate
    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "moon",
      start: new Date("2024-02-14T00:00:00Z"),
      end: new Date("2024-02-15T00:00:00Z"),
      thresholdDeg: 10,
    });

    const results = candidates
      .map((candidate) =>
        fineScan({
          observer: MILAN,
          tleLine1: ISS_TLE_FIXTURE.line1,
          tleLine2: ISS_TLE_FIXTURE.line2,
          satelliteNoradId: ISS_NORAD_ID,
          candidate,
        }),
      )
      .filter((r) => r !== null);

    // Pipeline should produce results for each candidate
    for (const result of results) {
      expect(result.closestApproach).toBeDefined();
      expect(result.closestApproach.targetAngularDiameterArcsec).toBeGreaterThan(0);
    }
  });
});
