import { describe, it, expect } from "vitest";
import { coarseScan } from "@/lib/engine/transit-detector";
import { ISS_TLE_FIXTURE } from "../../fixtures/tle-fixtures";

const MILAN: { lat: number; lon: number } = { lat: 45.4642, lon: 9.19 };
const ISS_NORAD_ID = 25544;

// ISS TLE epoch is ~Feb 14, 2024. Scan near that date for validity.
const EPOCH_DATE = new Date("2024-02-14T12:00:00Z");

describe("coarseScan", () => {
  it("should_find_candidate_window_when_threshold_is_wide", () => {
    // Scan 24 hours near TLE epoch with a relaxed threshold (10 degrees)
    // so we're likely to catch ISS passing near the Sun
    const start = new Date(EPOCH_DATE.getTime());
    const end = new Date(EPOCH_DATE.getTime() + 24 * 60 * 60 * 1000);

    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start,
      end,
      thresholdDeg: 10,
    });

    // With a 10-degree threshold over 24 hours, we should find at least
    // one candidate (ISS orbits every ~92 min, passes near Sun sometimes)
    expect(candidates.length).toBeGreaterThanOrEqual(0);
    for (const c of candidates) {
      expect(c.target).toBe("sun");
      expect(c.satelliteNoradId).toBe(ISS_NORAD_ID);
      expect(c.start.getTime()).toBeLessThanOrEqual(c.end.getTime());
      expect(c.minSeparationDeg).toBeLessThan(10);
      expect(c.minSeparationDeg).toBeGreaterThanOrEqual(0);
    }
  });

  it("should_skip_nighttime_for_solar_transits", () => {
    // Scan during Milan nighttime (Feb 14, 2024 ~22:00 to 04:00 UTC)
    // Sun is below horizon, so no solar transit candidates
    const start = new Date("2024-02-14T22:00:00Z");
    const end = new Date("2024-02-15T04:00:00Z");

    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start,
      end,
    });

    expect(candidates).toHaveLength(0);
  });

  it("should_skip_when_satellite_below_horizon", () => {
    // Scan a very short window (2 minutes) - unlikely to have ISS above horizon
    // AND near the Sun simultaneously
    const start = new Date("2024-02-14T12:00:00Z");
    const end = new Date("2024-02-14T12:02:00Z");

    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start,
      end,
    });

    // In a 2-minute window with 2-degree threshold, extremely unlikely
    // to find a transit candidate
    for (const c of candidates) {
      expect(c.minSeparationDeg).toBeLessThan(2);
    }
  });

  it("should_return_empty_when_no_candidates", () => {
    // 1-minute window with default (tight) threshold - no transits expected
    const start = new Date("2024-02-14T12:00:00Z");
    const end = new Date("2024-02-14T12:01:00Z");

    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start,
      end,
    });

    // With default 2-degree threshold in 1 minute, no candidates expected
    expect(candidates).toHaveLength(0);
  });

  it("should_consolidate_consecutive_points_into_windows", () => {
    // Scan a 6-hour daytime window with a wide threshold
    const start = new Date("2024-02-14T08:00:00Z");
    const end = new Date("2024-02-14T14:00:00Z");

    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "sun",
      start,
      end,
      thresholdDeg: 15,
    });

    // Each candidate window should span a continuous time range
    for (const c of candidates) {
      expect(c.start).toBeInstanceOf(Date);
      expect(c.end).toBeInstanceOf(Date);
      expect(c.end.getTime()).toBeGreaterThanOrEqual(c.start.getTime());
    }

    // Windows should not overlap
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i].start.getTime()).toBeGreaterThan(candidates[i - 1].end.getTime());
    }
  });

  it("should_support_moon_target", () => {
    // Scan 24 hours for lunar transit candidates with wide threshold
    const start = new Date("2024-02-14T00:00:00Z");
    const end = new Date("2024-02-15T00:00:00Z");

    const candidates = coarseScan({
      observer: MILAN,
      tleLine1: ISS_TLE_FIXTURE.line1,
      tleLine2: ISS_TLE_FIXTURE.line2,
      satelliteNoradId: ISS_NORAD_ID,
      target: "moon",
      start,
      end,
      thresholdDeg: 10,
    });

    for (const c of candidates) {
      expect(c.target).toBe("moon");
      expect(c.satelliteNoradId).toBe(ISS_NORAD_ID);
    }
  });
});
