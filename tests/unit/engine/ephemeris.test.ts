import { describe, it, expect } from "vitest";
import {
  getSunPosition,
  getMoonPosition,
  getSunAngularDiameterArcsec,
  getMoonAngularDiameterArcsec,
} from "@/lib/engine/ephemeris";

describe("sun ephemeris", () => {
  it("should_compute_sun_position_at_known_time", () => {
    // June 21, 2024 ~11:23 UTC is close to local solar noon for Milan (lon 9.19E)
    // Solar noon UTC = 12:00 - (lon/15) hours = 12:00 - 0.61 = ~11:23 UTC
    const pos = getSunPosition(
      new Date("2024-06-21T11:23:00Z"),
      { lat: 45.4642, lon: 9.19 },
    );

    // At local solar noon in Milan on June solstice, Sun altitude ~68 degrees
    // (90 - 45.46 + 23.44 = 67.98)
    expect(pos.elevationDeg).toBeGreaterThan(60);
    expect(pos.elevationDeg).toBeLessThan(75);
    // Sun should be roughly south-southeast to south (130-200 degrees azimuth)
    expect(pos.azimuthDeg).toBeGreaterThan(120);
    expect(pos.azimuthDeg).toBeLessThan(200);
  });

  it("should_return_negative_altitude_when_below_horizon", () => {
    // Midnight UTC in Milan - Sun should be well below horizon
    const pos = getSunPosition(
      new Date("2024-06-21T01:00:00Z"),
      { lat: 45.4642, lon: 9.19 },
    );
    expect(pos.elevationDeg).toBeLessThan(0);
  });

  it("should_compute_angular_diameter_of_sun", () => {
    const arcsec = getSunAngularDiameterArcsec(new Date("2024-06-21T12:00:00Z"));
    // Sun angular diameter: ~1890-1950 arcseconds (varies with Earth-Sun distance)
    expect(arcsec).toBeGreaterThan(1880);
    expect(arcsec).toBeLessThan(1960);
  });
});

describe("moon ephemeris", () => {
  it("should_compute_moon_position_at_known_time", () => {
    const pos = getMoonPosition(
      new Date("2024-02-24T22:00:00Z"),
      { lat: 45.4642, lon: 9.19 },
    );
    // Moon should be somewhere in the sky - verify it returns valid numbers
    expect(pos.elevationDeg).toBeGreaterThanOrEqual(-90);
    expect(pos.elevationDeg).toBeLessThanOrEqual(90);
    expect(pos.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(pos.azimuthDeg).toBeLessThanOrEqual(360);
  });

  it("should_compute_angular_diameter_of_moon", () => {
    const arcsec = getMoonAngularDiameterArcsec(new Date("2024-02-24T22:00:00Z"));
    // Moon angular diameter: ~1760-2200 arcseconds (varies with distance)
    expect(arcsec).toBeGreaterThan(1750);
    expect(arcsec).toBeLessThan(2250);
  });

  it("should_compute_different_moon_diameter_at_perigee_vs_apogee", () => {
    // Moon is closer at perigee, so angular diameter should be larger
    // These dates are approximate - we just verify it varies
    const d1 = getMoonAngularDiameterArcsec(new Date("2024-01-13T12:00:00Z"));
    const d2 = getMoonAngularDiameterArcsec(new Date("2024-01-25T12:00:00Z"));
    expect(d1).not.toBeCloseTo(d2, 0);
  });
});
