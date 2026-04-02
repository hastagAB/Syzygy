import { describe, it, expect } from "vitest";
import { propagateSatellite, getTopocentricPosition } from "@/lib/engine/sgp4";
import { ISS_TLE_FIXTURE } from "../../../tests/fixtures/tle-fixtures";

describe("SGP4 propagation", () => {
  it("should_propagate_iss_position_at_known_epoch", () => {
    // The TLE epoch is ~Feb 14 2024 12:25 UTC
    const date = new Date("2024-02-14T12:25:00Z");
    const result = propagateSatellite(ISS_TLE_FIXTURE.line1, ISS_TLE_FIXTURE.line2, date);

    expect(result).not.toBeNull();
    if (!result) return;

    // ISS should be at roughly 400-430 km altitude
    expect(result.geodetic.altKm).toBeGreaterThan(350);
    expect(result.geodetic.altKm).toBeLessThan(500);

    // Latitude should be within ISS inclination bounds (+/- 51.6 deg)
    expect(Math.abs(result.geodetic.lat)).toBeLessThanOrEqual(52);
  });

  it("should_propagate_iss_short_time_after_epoch", () => {
    // 1 hour after epoch - should still be very accurate
    const date = new Date("2024-02-14T13:25:00Z");
    const result = propagateSatellite(ISS_TLE_FIXTURE.line1, ISS_TLE_FIXTURE.line2, date);

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.geodetic.altKm).toBeGreaterThan(350);
    expect(result.geodetic.altKm).toBeLessThan(500);
  });

  it("should_return_eci_position_vectors", () => {
    const date = new Date("2024-02-14T12:25:00Z");
    const result = propagateSatellite(ISS_TLE_FIXTURE.line1, ISS_TLE_FIXTURE.line2, date);

    expect(result).not.toBeNull();
    if (!result) return;

    // ECI position should be roughly Earth radius + altitude = ~6770 km from center
    const r = Math.sqrt(result.eci.x ** 2 + result.eci.y ** 2 + result.eci.z ** 2);
    expect(r).toBeGreaterThan(6500);
    expect(r).toBeLessThan(7000);
  });

  it("should_return_null_for_invalid_tle", () => {
    const result = propagateSatellite("invalid line1", "invalid line2", new Date());
    expect(result).toBeNull();
  });
});

describe("topocentric position", () => {
  it("should_compute_topocentric_from_observer", () => {
    const date = new Date("2024-02-14T12:25:00Z");
    const satResult = propagateSatellite(
      ISS_TLE_FIXTURE.line1,
      ISS_TLE_FIXTURE.line2,
      date,
    );
    expect(satResult).not.toBeNull();
    if (!satResult) return;

    // Observer in Milan
    const observer = { lat: 45.4642, lon: 9.19 };
    const topo = getTopocentricPosition(satResult.eci, date, observer);

    // Azimuth should be 0-360
    expect(topo.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(topo.azimuthDeg).toBeLessThanOrEqual(360);

    // Elevation can be negative (below horizon) or positive
    expect(topo.elevationDeg).toBeGreaterThanOrEqual(-90);
    expect(topo.elevationDeg).toBeLessThanOrEqual(90);

    // Range should be a positive number in km
    expect(topo.rangeKm).toBeGreaterThan(0);
  });
});
