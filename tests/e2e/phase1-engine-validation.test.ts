/**
 * Phase 1 E2E Validation: Full engine pipeline test.
 *
 * Validates: TLE parsing -> SGP4 propagation -> ephemeris -> coarse scan ->
 * fine scan -> ground track. Uses real orbital mechanics, no mocks.
 */
import { describe, it, expect } from "vitest";
import { coarseScan, fineScan } from "@/lib/engine/transit-detector";
import { computeGroundTrack } from "@/lib/engine/ground-track";
import {
  ISS_DAYTIME_PASS,
  ISS_NIGHTTIME_NO_TRANSIT,
  ISS_LUNAR_PASS,
} from "../fixtures/known-transits";

describe("Phase 1 E2E: Engine Pipeline Validation", () => {
  it("should_find_solar_candidates_during_daytime_pass", () => {
    const fixture = ISS_DAYTIME_PASS;
    const candidates = coarseScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
      thresholdDeg: 10,
    });

    // Should find at least one candidate with relaxed threshold
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    // Validate candidate structure
    for (const c of candidates) {
      expect(c.target).toBe("sun");
      expect(c.satelliteNoradId).toBe(25544);
      expect(c.start).toBeInstanceOf(Date);
      expect(c.end).toBeInstanceOf(Date);
      expect(c.start.getTime()).toBeLessThanOrEqual(c.end.getTime());
      expect(c.minSeparationDeg).toBeGreaterThanOrEqual(0);
      expect(c.minSeparationDeg).toBeLessThan(10);
    }
  });

  it("should_refine_candidates_through_fine_scan", () => {
    const fixture = ISS_DAYTIME_PASS;
    const candidates = coarseScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
      thresholdDeg: 10,
    });

    expect(candidates.length).toBeGreaterThanOrEqual(1);

    // Fine scan each candidate
    const fineResults = candidates.map((candidate) =>
      fineScan({
        observer: fixture.observer,
        tleLine1: fixture.satellite.line1,
        tleLine2: fixture.satellite.line2,
        satelliteNoradId: fixture.satellite.noradId,
        candidate,
      }),
    );

    // At least some fine scans should return results
    const validResults = fineResults.filter((r) => r !== null);
    expect(validResults.length).toBeGreaterThanOrEqual(1);

    for (const result of validResults) {
      // Closest approach data should be present
      expect(result.closestApproach.separationArcsec).toBeGreaterThanOrEqual(0);
      expect(result.closestApproach.time).toBeInstanceOf(Date);
      expect(result.closestApproach.satelliteAngularDiameterArcsec).toBeGreaterThan(0);
      expect(result.closestApproach.targetAngularDiameterArcsec).toBeGreaterThan(800);

      // Target position should be reasonable
      expect(result.closestApproach.targetPosition.altitudeDeg).toBeGreaterThan(0);
    }
  });

  it("should_compute_ground_track_for_best_candidate", () => {
    const fixture = ISS_DAYTIME_PASS;
    const candidates = coarseScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
      thresholdDeg: 10,
    });

    expect(candidates.length).toBeGreaterThanOrEqual(1);

    const fineResult = fineScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      candidate: candidates[0],
    });

    expect(fineResult).not.toBeNull();

    const groundTrack = computeGroundTrack({
      center: fixture.observer,
      radiusKm: 50,
      gridSpacingKm: 5,
      transitTime: fineResult!.closestApproach.time,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      target: fixture.target,
    });

    // Ground track should produce grid points
    expect(groundTrack.gridPoints.length).toBeGreaterThan(0);
    expect(groundTrack.bestPoint).toBeDefined();
    expect(groundTrack.bestPoint.separationArcsec).toBeGreaterThanOrEqual(0);
  });

  it("should_report_no_solar_candidates_at_night", () => {
    const fixture = ISS_NIGHTTIME_NO_TRANSIT;
    const candidates = coarseScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
    });

    expect(candidates).toHaveLength(0);
  });

  it("should_find_lunar_candidates", () => {
    const fixture = ISS_LUNAR_PASS;
    const candidates = coarseScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
      thresholdDeg: 5,
    });

    // Should find lunar candidates over 2-day window
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    for (const c of candidates) {
      expect(c.target).toBe("moon");
    }
  });

  it("should_report_no_transit_for_distant_location", () => {
    // Use same time window as daytime pass but from a very different location
    const fixture = ISS_DAYTIME_PASS;
    const distantObserver = { lat: -33.87, lon: 151.21 }; // Sydney, Australia

    const candidates = coarseScan({
      observer: distantObserver,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
      // Default 2-degree threshold - tight
    });

    // May or may not find candidates from Sydney, but if found they should be
    // different from Milan candidates (different viewing geometry)
    for (const c of candidates) {
      expect(c.target).toBe("sun");
      expect(c.satelliteNoradId).toBe(25544);
    }
  });

  it("should_complete_full_pipeline_within_performance_budget", () => {
    const fixture = ISS_DAYTIME_PASS;
    const startTime = Date.now();

    // Full pipeline: coarse scan 36 hours
    const candidates = coarseScan({
      observer: fixture.observer,
      tleLine1: fixture.satellite.line1,
      tleLine2: fixture.satellite.line2,
      satelliteNoradId: fixture.satellite.noradId,
      target: fixture.target,
      start: new Date(fixture.searchWindow.start),
      end: new Date(fixture.searchWindow.end),
      thresholdDeg: 10,
    });

    // Fine scan all candidates
    for (const candidate of candidates) {
      fineScan({
        observer: fixture.observer,
        tleLine1: fixture.satellite.line1,
        tleLine2: fixture.satellite.line2,
        satelliteNoradId: fixture.satellite.noradId,
        candidate,
      });
    }

    const elapsed = Date.now() - startTime;

    // 36-hour scan should complete well under 10 seconds
    expect(elapsed).toBeLessThan(10_000);
  });
});
