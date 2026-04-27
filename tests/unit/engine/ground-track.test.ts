import { describe, it, expect } from "vitest";
import { computeGroundTrack, generateGrid } from "@/lib/engine/ground-track";
import { coarseScan, fineScan } from "@/lib/engine/transit-detector";
import { haversineDistanceKm } from "@/lib/engine/geometry";
import { ISS_TLE_FIXTURE } from "../../fixtures/tle-fixtures";

const MILAN = { lat: 45.4642, lon: 9.19 };
const ISS_NORAD_ID = 25544;

describe("generateGrid", () => {
  it("should_return_points_within_radius_only", () => {
    const grid = generateGrid(MILAN, 50, 5);

    for (const point of grid) {
      const dist = haversineDistanceKm(MILAN, point);
      expect(dist).toBeLessThanOrEqual(50 + 1); // small tolerance for rounding
    }
  });

  it("should_handle_small_radius", () => {
    const grid = generateGrid(MILAN, 10, 2);

    expect(grid.length).toBeGreaterThan(0);
    for (const point of grid) {
      const dist = haversineDistanceKm(MILAN, point);
      expect(dist).toBeLessThanOrEqual(10 + 1);
    }
  });

  it("should_produce_more_points_with_larger_radius", () => {
    const smallGrid = generateGrid(MILAN, 20, 5);
    const largeGrid = generateGrid(MILAN, 100, 5);

    expect(largeGrid.length).toBeGreaterThan(smallGrid.length);
  });
});

describe("computeGroundTrack", () => {
  it("should_compute_ground_track_for_candidate", () => {
    // Find a candidate window first
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

    // Fine scan to get closest approach time
    const fineResult = fineScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      candidate: candidates[0],
    });

    if (!fineResult) return;

    const result = computeGroundTrack({
      center: MILAN,
      radiusKm: 50,
      gridSpacingKm: 5,
      transitTime: fineResult.closestApproach.time,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      target: "sun",
    });

    // Should return a valid result
    expect(result.bestPoint).toBeDefined();
    expect(result.bestPoint.separationArcsec).toBeGreaterThanOrEqual(0);
    expect(result.gridPoints.length).toBeGreaterThan(0);

    // All grid points should be within radius
    for (const point of result.gridPoints) {
      const dist = haversineDistanceKm(MILAN, { lat: point.lat, lon: point.lon });
      expect(dist).toBeLessThanOrEqual(50 + 1);
    }
  });

  it("should_compute_corridor_width", () => {
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

    const fineResult = fineScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      candidate: candidates[0],
    });

    if (!fineResult) return;

    const result = computeGroundTrack({
      center: MILAN,
      radiusKm: 100,
      gridSpacingKm: 2,
      transitTime: fineResult.closestApproach.time,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      target: "sun",
    });

    // Corridor width should be non-negative
    expect(result.corridorWidthKm).toBeGreaterThanOrEqual(0);

    // If there's a corridor, width should be reasonable (< 2x radius)
    if (result.corridor.length > 0) {
      expect(result.corridorWidthKm).toBeLessThan(200);
    }
  });

  it("should_return_centerline_sorted_by_longitude", () => {
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

    const fineResult = fineScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      candidate: candidates[0],
    });

    if (!fineResult) return;

    const result = computeGroundTrack({
      center: MILAN,
      radiusKm: 50,
      gridSpacingKm: 5,
      transitTime: fineResult.closestApproach.time,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      target: "sun",
    });

    // Centerline should be sorted west-to-east (ascending longitude)
    for (let i = 1; i < result.centerline.length; i++) {
      expect(result.centerline[i].lon).toBeGreaterThanOrEqual(result.centerline[i - 1].lon);
    }
  });
});
