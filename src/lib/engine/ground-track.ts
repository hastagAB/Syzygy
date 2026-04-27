import { propagateSatellite, getTopocentricPosition } from "@/lib/engine/sgp4";
import {
  getSunPosition,
  getMoonPosition,
  getSunAngularDiameterArcsec,
  getMoonAngularDiameterArcsec,
} from "@/lib/engine/ephemeris";
import {
  angularSeparationDeg,
  haversineDistanceKm,
  satelliteAngularDiameterArcsec,
} from "@/lib/engine/geometry";
import { GRID_SPACING_KM, DEFAULT_SATELLITE_SIZE_METERS } from "@/lib/config";
import type { LatLon } from "@/types";
import type { TransitTarget } from "@/types/transit";

export interface GroundTrackOptions {
  readonly center: LatLon;
  readonly radiusKm: number;
  readonly gridSpacingKm?: number;
  readonly transitTime: Date;
  readonly tleLine1: string;
  readonly tleLine2: string;
  readonly target: TransitTarget;
  readonly satelliteSizeMeters?: number;
}

export interface GroundTrackPoint {
  readonly lat: number;
  readonly lon: number;
  readonly separationArcsec: number;
  readonly isTransitVisible: boolean;
}

export interface GroundTrackResult {
  readonly centerline: readonly LatLon[];
  readonly corridor: readonly LatLon[];
  readonly corridorWidthKm: number;
  readonly bestPoint: LatLon & { readonly separationArcsec: number };
  readonly gridPoints: readonly GroundTrackPoint[];
}

/**
 * Generate a grid of lat/lon points within a circular radius of a center point.
 * Grid spacing is approximate, in km.
 */
export function generateGrid(center: LatLon, radiusKm: number, spacingKm: number): LatLon[] {
  const points: LatLon[] = [];

  // Convert spacing to approximate degree offsets
  const latSpacingDeg = spacingKm / 111.32;
  const lonSpacingDeg = spacingKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  const latRadiusDeg = radiusKm / 111.32;
  const lonRadiusDeg = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));

  for (let dLat = -latRadiusDeg; dLat <= latRadiusDeg; dLat += latSpacingDeg) {
    for (let dLon = -lonRadiusDeg; dLon <= lonRadiusDeg; dLon += lonSpacingDeg) {
      const point = { lat: center.lat + dLat, lon: center.lon + dLon };
      if (haversineDistanceKm(center, point) <= radiusKm) {
        points.push(point);
      }
    }
  }

  return points;
}

/**
 * Compute the ground track for a transit event.
 * Sweeps a grid of points within the travel radius and computes
 * angular separation at each point to find the centerline and corridor.
 */
export function computeGroundTrack(options: GroundTrackOptions): GroundTrackResult {
  const {
    center,
    radiusKm,
    gridSpacingKm = GRID_SPACING_KM,
    transitTime,
    tleLine1,
    tleLine2,
    target,
    satelliteSizeMeters = DEFAULT_SATELLITE_SIZE_METERS,
  } = options;

  const getTargetPosition = target === "sun" ? getSunPosition : getMoonPosition;
  const getTargetDiameter =
    target === "sun" ? getSunAngularDiameterArcsec : getMoonAngularDiameterArcsec;

  // Propagate satellite once (ECI is the same for all observers at same time)
  const satResult = propagateSatellite(tleLine1, tleLine2, transitTime);
  if (!satResult) {
    return emptyResult(center);
  }

  const targetDiamArcsec = getTargetDiameter(transitTime);
  const grid = generateGrid(center, radiusKm, gridSpacingKm);
  const gridPoints: GroundTrackPoint[] = [];

  let bestSep = Infinity;
  let bestLat = center.lat;
  let bestLon = center.lon;

  for (const point of grid) {
    const satTopo = getTopocentricPosition(satResult.eci, transitTime, point);

    // Skip if satellite below horizon from this point
    if (satTopo.elevationDeg < 0) {
      gridPoints.push({
        lat: point.lat,
        lon: point.lon,
        separationArcsec: Infinity,
        isTransitVisible: false,
      });
      continue;
    }

    const targetPos = getTargetPosition(transitTime, point);
    const sepDeg = angularSeparationDeg(satTopo, targetPos);
    const sepArcsec = sepDeg * 3600;

    const satDiam = satelliteAngularDiameterArcsec(satelliteSizeMeters, satTopo.rangeKm);
    const transitThreshold = (targetDiamArcsec + satDiam) / 2;
    const isVisible = sepArcsec < transitThreshold;

    gridPoints.push({
      lat: point.lat,
      lon: point.lon,
      separationArcsec: sepArcsec,
      isTransitVisible: isVisible,
    });

    if (sepArcsec < bestSep) {
      bestSep = sepArcsec;
      bestLat = point.lat;
      bestLon = point.lon;
    }
  }

  // Build corridor (all points where transit is visible)
  const corridor = gridPoints
    .filter((p) => p.isTransitVisible)
    .map((p) => ({ lat: p.lat, lon: p.lon }));

  // Build centerline: for each unique longitude band, find the point with min separation
  const centerline = buildCenterline(gridPoints, corridor);

  // Compute corridor width
  const corridorWidthKm = computeCorridorWidth(corridor, center);

  return {
    centerline,
    corridor,
    corridorWidthKm,
    bestPoint: { lat: bestLat, lon: bestLon, separationArcsec: bestSep },
    gridPoints,
  };
}

/** Build centerline from corridor points, sorted west-to-east */
function buildCenterline(
  gridPoints: readonly GroundTrackPoint[],
  corridor: readonly LatLon[],
): LatLon[] {
  if (corridor.length === 0) {
    return [];
  }

  // Group corridor points by approximate longitude band
  const lonBands = new Map<number, GroundTrackPoint[]>();
  const bandWidth = 0.01; // ~1km at mid-latitudes

  for (const point of gridPoints) {
    if (!point.isTransitVisible) continue;
    const bandKey = Math.round(point.lon / bandWidth);
    const band = lonBands.get(bandKey);
    if (band) {
      band.push(point);
    } else {
      lonBands.set(bandKey, [point]);
    }
  }

  // For each band, find the point with minimum separation
  const centerPoints: LatLon[] = [];
  for (const [, band] of lonBands) {
    let minSep = Infinity;
    let bestPoint: GroundTrackPoint | null = null;
    for (const p of band) {
      if (p.separationArcsec < minSep) {
        minSep = p.separationArcsec;
        bestPoint = p;
      }
    }
    if (bestPoint) {
      centerPoints.push({ lat: bestPoint.lat, lon: bestPoint.lon });
    }
  }

  // Sort west-to-east (ascending longitude)
  centerPoints.sort((a, b) => a.lon - b.lon);

  return centerPoints;
}

/** Compute approximate corridor width in km */
function computeCorridorWidth(corridor: readonly LatLon[], center: LatLon): number {
  if (corridor.length < 2) return 0;

  // Find the min and max latitude among corridor points at the center's longitude
  // This gives a rough north-south width
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const point of corridor) {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
  }

  // Also check east-west extent
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const point of corridor) {
    if (point.lon < minLon) minLon = point.lon;
    if (point.lon > maxLon) maxLon = point.lon;
  }

  // Width is the smaller of the two extents (perpendicular to track direction)
  const nsWidth = haversineDistanceKm(
    { lat: minLat, lon: center.lon },
    { lat: maxLat, lon: center.lon },
  );
  const ewWidth = haversineDistanceKm(
    { lat: center.lat, lon: minLon },
    { lat: center.lat, lon: maxLon },
  );

  return Math.min(nsWidth, ewWidth);
}

function emptyResult(center: LatLon): GroundTrackResult {
  return {
    centerline: [],
    corridor: [],
    corridorWidthKm: 0,
    bestPoint: { lat: center.lat, lon: center.lon, separationArcsec: Infinity },
    gridPoints: [],
  };
}
