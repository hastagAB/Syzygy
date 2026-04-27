import { describe, it, expect } from "vitest";
import {
  degToRad,
  radToDeg,
  angularSeparationDeg,
  haversineDistanceKm,
  satelliteAngularDiameterArcsec,
} from "@/lib/engine/geometry";

describe("geometry", () => {
  it("should_convert_degrees_radians_roundtrip", () => {
    const original = 45;
    const result = radToDeg(degToRad(original));
    expect(result).toBeCloseTo(original, 10);
  });

  it("should_convert_zero_degrees", () => {
    expect(degToRad(0)).toBe(0);
    expect(radToDeg(0)).toBe(0);
  });

  it("should_convert_360_degrees", () => {
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 10);
  });

  it("should_compute_angular_separation_zero_when_same_point", () => {
    const sep = angularSeparationDeg(
      { azimuthDeg: 180, elevationDeg: 45 },
      { azimuthDeg: 180, elevationDeg: 45 },
    );
    expect(sep).toBeCloseTo(0, 6);
  });

  it("should_compute_angular_separation_known_pair", () => {
    // Two points 90 degrees apart: zenith and horizon-south
    const sep = angularSeparationDeg(
      { azimuthDeg: 180, elevationDeg: 90 },
      { azimuthDeg: 180, elevationDeg: 0 },
    );
    expect(sep).toBeCloseTo(90, 4);
  });

  it("should_compute_angular_separation_opposite_azimuths", () => {
    // Two points on horizon, opposite sides (N and S)
    const sep = angularSeparationDeg(
      { azimuthDeg: 0, elevationDeg: 0 },
      { azimuthDeg: 180, elevationDeg: 0 },
    );
    expect(sep).toBeCloseTo(180, 4);
  });

  it("should_compute_angular_separation_small_angle", () => {
    // Two points very close together (0.5 degrees apart in elevation)
    const sep = angularSeparationDeg(
      { azimuthDeg: 180, elevationDeg: 45.0 },
      { azimuthDeg: 180, elevationDeg: 45.5 },
    );
    expect(sep).toBeCloseTo(0.5, 2);
  });

  it("should_compute_haversine_distance_known_cities", () => {
    // London to Paris: ~343 km
    const dist = haversineDistanceKm({ lat: 51.5074, lon: -0.1278 }, { lat: 48.8566, lon: 2.3522 });
    expect(dist).toBeCloseTo(343, -1); // within 10 km
  });

  it("should_compute_haversine_zero_for_same_point", () => {
    const dist = haversineDistanceKm({ lat: 45.0, lon: 9.0 }, { lat: 45.0, lon: 9.0 });
    expect(dist).toBe(0);
  });

  it("should_handle_antimeridian_crossing", () => {
    // Points on either side of the antimeridian
    const dist = haversineDistanceKm({ lat: 0, lon: 179 }, { lat: 0, lon: -179 });
    // Should be ~222 km, not ~39,800 km
    expect(dist).toBeLessThan(300);
  });

  it("should_compute_satellite_angular_diameter", () => {
    // ISS at 408 km altitude, 109m size, observer roughly below
    // slant range ~ 408 km
    const arcsec = satelliteAngularDiameterArcsec(109, 408);
    // Expected ~55 arcsec
    expect(arcsec).toBeGreaterThan(40);
    expect(arcsec).toBeLessThan(70);
  });

  it("should_compute_larger_angular_diameter_when_closer", () => {
    const close = satelliteAngularDiameterArcsec(109, 400);
    const far = satelliteAngularDiameterArcsec(109, 800);
    expect(close).toBeGreaterThan(far);
  });
});
