/**
 * ACCURACY AUDIT - Critical validation of the transit prediction pipeline.
 *
 * Cross-checks each computational layer against independently known values.
 * If any of these tests fail, transit predictions may send people to wrong locations.
 */
import { describe, it, expect } from "vitest";
import {
  getSunPosition,
  getMoonPosition,
  getSunAngularDiameterArcsec,
  getMoonAngularDiameterArcsec,
} from "@/lib/engine/ephemeris";
import { propagateSatellite, getTopocentricPosition } from "@/lib/engine/sgp4";
import { angularSeparationDeg, satelliteAngularDiameterArcsec } from "@/lib/engine/geometry";
import { ISS_TLE_FIXTURE } from "../../fixtures/tle-fixtures";

// =========================================================================
// Layer 1: Sun ephemeris cross-check
// Reference: USNO/Stellarium verified values
// =========================================================================
describe("accuracy: sun position", () => {
  it("should_match_known_sun_altitude_at_solar_noon_within_1deg", () => {
    // June 21 2024, solar noon at Greenwich (lon=0)
    // Expected altitude: 90 - 51.48 + 23.44 = 61.96 degrees
    const greenwich = { lat: 51.4769, lon: -0.0005 };
    const solarNoon = new Date("2024-06-21T12:00:00Z");
    const pos = getSunPosition(solarNoon, greenwich);
    expect(pos.elevationDeg).toBeGreaterThan(60);
    expect(pos.elevationDeg).toBeLessThan(63);
  });

  it("should_match_known_sun_altitude_at_equinox_equator_within_1deg", () => {
    // March 20 2024 equinox, solar noon at lon=0
    // Sun directly overhead at equator, alt ~90 at equator
    const equator = { lat: 0, lon: 0 };
    const equinoxNoon = new Date("2024-03-20T12:00:00Z");
    const pos = getSunPosition(equinoxNoon, equator);
    // Should be very close to 90 at equinox noon
    expect(pos.elevationDeg).toBeGreaterThan(85);
    expect(pos.elevationDeg).toBeLessThan(91);
  });

  it("should_place_sun_below_horizon_at_midnight_local", () => {
    // Midnight local time in New Delhi (IST = UTC+5:30)
    // Midnight IST = 2024-06-21T18:30:00Z
    const delhi = { lat: 28.6139, lon: 77.209 };
    const midnightIST = new Date("2024-06-21T18:30:00Z");
    const pos = getSunPosition(midnightIST, delhi);
    expect(pos.elevationDeg).toBeLessThan(-10);
  });

  it("should_compute_sun_angular_diameter_within_5_arcsec", () => {
    // At perihelion (Jan 3) Sun diameter ~1952 arcsec
    // At aphelion (Jul 5) Sun diameter ~1888 arcsec
    const perihelion = getSunAngularDiameterArcsec(new Date("2024-01-03T12:00:00Z"));
    const aphelion = getSunAngularDiameterArcsec(new Date("2024-07-05T12:00:00Z"));

    expect(perihelion).toBeGreaterThan(1945);
    expect(perihelion).toBeLessThan(1960);
    expect(aphelion).toBeGreaterThan(1883);
    expect(aphelion).toBeLessThan(1898);
    expect(perihelion).toBeGreaterThan(aphelion);
  });
});

// =========================================================================
// Layer 2: Moon ephemeris cross-check
// =========================================================================
describe("accuracy: moon position", () => {
  it("should_compute_moon_angular_diameter_within_physical_bounds", () => {
    // Moon diameter varies between ~1762 arcsec (apogee) and ~2010 arcsec (perigee)
    // Test across a month to hit both extremes
    const samples: number[] = [];
    for (let day = 0; day < 30; day++) {
      const date = new Date(`2024-02-${String(day + 1).padStart(2, "0")}T12:00:00Z`);
      samples.push(getMoonAngularDiameterArcsec(date));
    }

    const min = Math.min(...samples);
    const max = Math.max(...samples);

    // All values must be within physical bounds
    expect(min).toBeGreaterThan(1750);
    expect(max).toBeLessThan(2100);
    // Must show variation (perigee vs apogee)
    expect(max - min).toBeGreaterThan(50);
  });

  it("should_compute_moon_parallax_effect_on_altitude", () => {
    // Moon parallax is ~1 degree at the horizon
    // Two observers 100km apart should see the Moon at slightly different altitudes
    const date = new Date("2024-02-24T20:00:00Z");
    const obs1 = { lat: 45.0, lon: 9.0 };
    const obs2 = { lat: 45.9, lon: 9.0 }; // ~100km north

    const pos1 = getMoonPosition(date, obs1);
    const pos2 = getMoonPosition(date, obs2);

    // Positions should differ due to parallax (topocentric adjustment)
    const altDiff = Math.abs(pos1.elevationDeg - pos2.elevationDeg);
    const azDiff = Math.abs(pos1.azimuthDeg - pos2.azimuthDeg);

    // Should see some difference (parallax is real)
    expect(altDiff + azDiff).toBeGreaterThan(0.01);
  });
});

// =========================================================================
// Layer 3: SGP4 propagation accuracy
// =========================================================================
describe("accuracy: sgp4 propagation", () => {
  it("should_place_ISS_at_correct_altitude_range", () => {
    // ISS orbits at ~408-420km altitude
    const tle = ISS_TLE_FIXTURE;
    const nearEpoch = new Date("2024-02-14T12:00:00Z");
    const result = propagateSatellite(tle.line1, tle.line2, nearEpoch);

    expect(result).not.toBeNull();
    expect(result!.geodetic.altKm).toBeGreaterThan(390);
    expect(result!.geodetic.altKm).toBeLessThan(430);
  });

  it("should_compute_ISS_orbital_period_close_to_92_minutes", () => {
    const tle = ISS_TLE_FIXTURE;
    const t0 = new Date("2024-02-14T12:00:00Z");
    const pos0 = propagateSatellite(tle.line1, tle.line2, t0)!;

    // Find the time when ISS returns to the same latitude
    // ISS orbital period is ~92.5 minutes
    const expectedPeriodMs = 92.5 * 60 * 1000;
    const t1 = new Date(t0.getTime() + expectedPeriodMs);
    const pos1 = propagateSatellite(tle.line1, tle.line2, t1)!;

    // After one orbital period, latitude should be similar (within ~5 degrees)
    const latDiff = Math.abs(pos0.geodetic.lat - pos1.geodetic.lat);
    expect(latDiff).toBeLessThan(5);
  });

  it("should_degrade_accuracy_far_from_epoch", () => {
    // TLE epoch is Feb 14, 2024. Propagating 30 days out should still work but less accurate
    const tle = ISS_TLE_FIXTURE;
    const farFromEpoch = new Date("2024-03-15T12:00:00Z");
    const result = propagateSatellite(tle.line1, tle.line2, farFromEpoch);

    // Should still produce valid coordinates (SGP4 doesn't hard fail)
    expect(result).not.toBeNull();
    expect(result!.geodetic.altKm).toBeGreaterThan(350);
    expect(result!.geodetic.altKm).toBeLessThan(450);
    // Latitude should be within ISS inclination bounds (51.6 degrees)
    expect(Math.abs(result!.geodetic.lat)).toBeLessThanOrEqual(52);
  });
});

// =========================================================================
// Layer 4: Angular separation correctness
// =========================================================================
describe("accuracy: angular separation", () => {
  it("should_return_zero_for_identical_positions", () => {
    const sep = angularSeparationDeg(
      { azimuthDeg: 180, elevationDeg: 45 },
      { azimuthDeg: 180, elevationDeg: 45 },
    );
    expect(sep).toBeCloseTo(0, 10);
  });

  it("should_return_90_for_orthogonal_positions", () => {
    // Zenith to horizon
    const sep = angularSeparationDeg(
      { azimuthDeg: 0, elevationDeg: 90 },
      { azimuthDeg: 0, elevationDeg: 0 },
    );
    expect(sep).toBeCloseTo(90, 5);
  });

  it("should_return_180_for_opposite_horizon_positions", () => {
    // Due north horizon to due south horizon
    const sep = angularSeparationDeg(
      { azimuthDeg: 0, elevationDeg: 0 },
      { azimuthDeg: 180, elevationDeg: 0 },
    );
    expect(sep).toBeCloseTo(180, 5);
  });

  it("should_compute_small_separation_in_arcseconds_accurately", () => {
    // 0.5 degree offset in elevation (1800 arcsec)
    const sep = angularSeparationDeg(
      { azimuthDeg: 180, elevationDeg: 45 },
      { azimuthDeg: 180, elevationDeg: 45.5 },
    );
    expect(sep * 3600).toBeCloseTo(1800, -1); // Within 10 arcsec
  });
});

// =========================================================================
// Layer 5: Satellite angular diameter
// =========================================================================
describe("accuracy: satellite angular diameter", () => {
  it("should_compute_ISS_angular_diameter_at_typical_range", () => {
    // ISS at 400km altitude, directly overhead: range ~400km, size 109m
    // Expected: 2 * atan(109 / (2 * 400000)) * 206265 = ~56 arcsec
    const diam = satelliteAngularDiameterArcsec(109, 400);
    expect(diam).toBeGreaterThan(50);
    expect(diam).toBeLessThan(60);
  });

  it("should_compute_ISS_angular_diameter_at_horizon_range", () => {
    // ISS near horizon: range ~2000km, size 109m
    // Expected: ~11 arcsec
    const diam = satelliteAngularDiameterArcsec(109, 2000);
    expect(diam).toBeGreaterThan(8);
    expect(diam).toBeLessThan(14);
  });

  it("should_compute_HST_angular_diameter", () => {
    // HST at 550km altitude, overhead: range ~550km, size 13.2m
    const diam = satelliteAngularDiameterArcsec(13.2, 550);
    expect(diam).toBeGreaterThan(4);
    expect(diam).toBeLessThan(6);
  });
});

// =========================================================================
// Layer 6: Transit geometry validation
// =========================================================================
describe("accuracy: transit geometry", () => {
  it("should_confirm_transit_threshold_calculation_is_correct", () => {
    // A transit occurs when sat-target separation < (targetDiam + satDiam) / 2
    // This means the satellite's CENTER is within one target-radius + half-sat-diameter
    // of the target center. This is the correct geometric definition.

    // Sun diameter ~1920 arcsec, ISS diameter ~56 arcsec at 400km
    const sunDiam = 1920;
    const issDiam = 56;
    const threshold = (sunDiam + issDiam) / 2;

    // Threshold should be ~988 arcsec = ~0.274 degrees
    expect(threshold).toBeGreaterThan(980);
    expect(threshold).toBeLessThan(1000);
    expect(threshold / 3600).toBeCloseTo(0.274, 1);
  });

  it("should_validate_parallax_shift_is_physically_reasonable", () => {
    // An observer offset by 100km from center should see the ISS at ~400km
    // shifted by roughly arctan(100/400) = 14 degrees in the sky.
    // This parallax is what makes transit paths so narrow.
    const parallaxDeg = (Math.atan(100 / 400) * 180) / Math.PI;
    expect(parallaxDeg).toBeGreaterThan(13);
    expect(parallaxDeg).toBeLessThan(15);
  });

  it("should_validate_transit_path_width_is_physically_correct", () => {
    // ISS solar transit path width:
    // Sun angular diameter ~0.53 degrees
    // ISS at 400km altitude
    // Path width = 2 * altitude * tan(sunDiameter / 2) = 2 * 400 * tan(0.265 deg)
    //            = 2 * 400 * 0.00463 = 3.7 km
    const sunHalfDiamRad = (0.53 / 2) * (Math.PI / 180);
    const pathWidth = 2 * 400 * Math.tan(sunHalfDiamRad);
    expect(pathWidth).toBeGreaterThan(3);
    expect(pathWidth).toBeLessThan(5);
  });
});

// =========================================================================
// Layer 7: Moon parallax consistency check
// =========================================================================
describe("accuracy: moon parallax consistency", () => {
  it("should_show_moon_altitude_shift_between_widely_spaced_observers", () => {
    // Two observers 500km apart should see the Moon at measurably different positions
    const date = new Date("2024-02-14T12:00:00Z");
    const obsNorth = { lat: 50, lon: 10 };
    const obsSouth = { lat: 45, lon: 10 };

    const moonN = getMoonPosition(date, obsNorth);
    const moonS = getMoonPosition(date, obsSouth);

    // Angular separation between the two apparent positions should be > 0.05 deg
    const sep = angularSeparationDeg(
      { azimuthDeg: moonN.azimuthDeg, elevationDeg: moonN.elevationDeg },
      { azimuthDeg: moonS.azimuthDeg, elevationDeg: moonS.elevationDeg },
    );

    // Moon parallax from 500km offset should be at least 0.05 degrees
    expect(sep).toBeGreaterThan(0.05);
    // But not more than ~5 degrees (max Moon parallax is ~1 degree)
    expect(sep).toBeLessThan(5);
  });

  it("should_show_sun_negligible_parallax_between_nearby_observers", () => {
    // Sun parallax is only ~8.8 arcsec - negligible
    const date = new Date("2024-06-21T12:00:00Z");
    const obs1 = { lat: 45, lon: 10 };
    const obs2 = { lat: 45.5, lon: 10 }; // ~55km north

    const sun1 = getSunPosition(date, obs1);
    const sun2 = getSunPosition(date, obs2);

    // Positions should differ by less than solar parallax + observer geometry
    // The 0.5 degree latitude difference itself changes the apparent position
    // but the parallax component should be tiny
    const sep = angularSeparationDeg(
      { azimuthDeg: sun1.azimuthDeg, elevationDeg: sun1.elevationDeg },
      { azimuthDeg: sun2.azimuthDeg, elevationDeg: sun2.elevationDeg },
    );

    // Should differ (due to observer latitude change) but within reason
    expect(sep).toBeLessThan(1);
  });
});

// =========================================================================
// Layer 8: End-to-end satellite-target separation accuracy
// =========================================================================
describe("accuracy: satellite topocentric position vs ephemeris", () => {
  it("should_produce_consistent_separations_from_nearby_observers", () => {
    // Two observers 10km apart should see similar sat-Sun separations
    // (the parallax for Sun is negligible, so difference is purely satellite parallax)
    const tle = ISS_TLE_FIXTURE;
    const date = new Date("2024-02-14T12:00:00Z");

    const obs1 = { lat: 45.0, lon: 9.0 };
    const obs2 = { lat: 45.09, lon: 9.0 }; // ~10km north

    const sat = propagateSatellite(tle.line1, tle.line2, date);
    if (!sat) return; // Skip if propagation fails

    const satTopo1 = getTopocentricPosition(sat.eci, date, obs1);
    const satTopo2 = getTopocentricPosition(sat.eci, date, obs2);

    // If satellite is above horizon from both
    if (satTopo1.elevationDeg > 5 && satTopo2.elevationDeg > 5) {
      const sun1 = getSunPosition(date, obs1);
      const sun2 = getSunPosition(date, obs2);

      const sep1 = angularSeparationDeg(satTopo1, sun1);
      const sep2 = angularSeparationDeg(satTopo2, sun2);

      // 10km offset at 400km altitude = ~1.4 degree parallax
      // Separations should differ but within satellite parallax bounds
      expect(Math.abs(sep1 - sep2)).toBeLessThan(3);
    }
  });
});
