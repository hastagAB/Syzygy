import { EARTH_RADIUS_KM } from "@/lib/config";
import type { LatLon } from "@/types";

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert radians to degrees */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Angular separation between two sky positions in degrees.
 * Uses the spherical law of cosines on alt/az coordinates.
 */
export function angularSeparationDeg(
  a: { azimuthDeg: number; elevationDeg: number },
  b: { azimuthDeg: number; elevationDeg: number },
): number {
  const alt1 = degToRad(a.elevationDeg);
  const alt2 = degToRad(b.elevationDeg);
  const dAz = degToRad(a.azimuthDeg - b.azimuthDeg);

  const cosD =
    Math.sin(alt1) * Math.sin(alt2) + Math.cos(alt1) * Math.cos(alt2) * Math.cos(dAz);

  // Clamp to [-1, 1] to avoid NaN from floating-point errors
  const clamped = Math.max(-1, Math.min(1, cosD));
  return radToDeg(Math.acos(clamped));
}

/**
 * Great-circle distance between two points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function haversineDistanceKm(a: LatLon, b: LatLon): number {
  const dLat = degToRad(b.lat - a.lat);
  const dLon = degToRad(b.lon - a.lon);
  const lat1 = degToRad(a.lat);
  const lat2 = degToRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Satellite angular diameter in arcseconds given its physical size
 * and slant range (distance from observer).
 */
export function satelliteAngularDiameterArcsec(
  sizeMeters: number,
  rangeKm: number,
): number {
  const rangeMeters = rangeKm * 1000;
  const angRad = 2 * Math.atan(sizeMeters / (2 * rangeMeters));
  return radToDeg(angRad) * 3600;
}

/**
 * Generate a sparse set of sample points within a circular area.
 * Returns center plus points at 0.35*radius and 0.7*radius in 8 directions.
 */
export function generateSamplePoints(
  center: LatLon,
  radiusKm: number,
): LatLon[] {
  if (radiusKm <= 0) return [center];

  const points: LatLon[] = [center];
  const cosLat = Math.cos(degToRad(center.lat));

  const rings = [0.35, 0.7];
  const directions: [number, number][] = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];

  for (const ringFraction of rings) {
    const rKm = radiusKm * ringFraction;
    const dLat = rKm / 111.32;
    const dLon = cosLat > 0.01 ? rKm / (111.32 * cosLat) : dLat;

    for (const [latDir, lonDir] of directions) {
      const norm = Math.sqrt(latDir * latDir + lonDir * lonDir);
      points.push({
        lat: center.lat + (dLat * latDir) / norm,
        lon: center.lon + (dLon * lonDir) / norm,
      });
    }
  }

  return points;
}
