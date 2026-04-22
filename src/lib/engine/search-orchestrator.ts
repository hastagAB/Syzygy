import { coarseScan, fineScan } from "@/lib/engine/transit-detector";
import { computeGroundTrack } from "@/lib/engine/ground-track";
import {
  generateSamplePoints,
  haversineDistanceKm,
  angularSeparationDeg,
} from "@/lib/engine/geometry";
import { propagateSatellite, getTopocentricPosition } from "@/lib/engine/sgp4";
import { getSunPosition, getMoonPosition } from "@/lib/engine/ephemeris";
import { DEFAULT_CANDIDATE_THRESHOLD_DEG } from "@/lib/config";
import type { LatLon } from "@/types";
import type {
  TransitTarget,
  TransitEvent,
  SearchSuggestions,
} from "@/types/transit";

export interface SatelliteInput {
  readonly noradId: number;
  readonly name: string;
  readonly line1: string;
  readonly line2: string;
  readonly sizeMeters: number;
}

export interface SearchInput {
  readonly observer: LatLon;
  readonly dateRange: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly radiusKm: number;
  readonly satellites: readonly SatelliteInput[];
  readonly targets: readonly TransitTarget[];
}

export interface SearchOutput {
  readonly meta: {
    readonly location: LatLon;
    readonly dateRange: { readonly start: string; readonly end: string };
    readonly radiusKm: number;
    readonly computeTimeMs: number;
  };
  readonly transits: readonly TransitEvent[];
  readonly suggestions: SearchSuggestions | null;
}

/**
 * Orchestrate the full transit search pipeline:
 * 1. Generate sample observation points across the travel radius
 * 2. Multi-observer coarse scan to find candidate windows
 * 3. For each candidate: locate best observation point via local ground track
 * 4. Fine scan from best point to confirm transit
 * 5. Full ground track for confirmed transits
 */
export function searchTransits(input: SearchInput): SearchOutput {
  const startTime = Date.now();
  const transits: TransitEvent[] = [];

  const samplePoints = generateSamplePoints(input.observer, input.radiusKm);

  // Expand the coarse threshold to account for parallax across the travel radius.
  // ISS at ~400km: arctan(radiusKm / 400) gives max parallax offset.
  // Use a conservative 350km to handle lower-altitude portions of orbits.
  const parallaxDeg = (Math.atan(input.radiusKm / 350) * 180) / Math.PI;
  const effectiveThreshold = DEFAULT_CANDIDATE_THRESHOLD_DEG + parallaxDeg;

  for (const sat of input.satellites) {
    for (const target of input.targets) {
      const candidates = coarseScan({
        observer: input.observer,
        observers: samplePoints,
        tleLine1: sat.line1,
        tleLine2: sat.line2,
        satelliteNoradId: sat.noradId,
        target,
        start: input.dateRange.start,
        end: input.dateRange.end,
        thresholdDeg: effectiveThreshold,
      });

      for (const candidate of candidates) {
        const midpointMs =
          (candidate.start.getTime() + candidate.end.getTime()) / 2;
        const midpointTime = new Date(midpointMs);

        const bestSample = findBestSamplePoint(
          samplePoints,
          sat.line1,
          sat.line2,
          midpointTime,
          target,
        );
        if (!bestSample) continue;

        // Preliminary fine scan to find accurate closest approach time
        const prelimResult = fineScan({
          observer: bestSample,
          tleLine1: sat.line1,
          tleLine2: sat.line2,
          satelliteNoradId: sat.noradId,
          candidate,
          satelliteSizeMeters: sat.sizeMeters,
        });
        if (!prelimResult) continue;

        // Local ground track around best sample at closest approach time
        const localRadius = Math.min(30, input.radiusKm);
        const localGT = computeGroundTrack({
          center: bestSample,
          radiusKm: localRadius,
          gridSpacingKm: 2,
          transitTime: prelimResult.closestApproach.time,
          tleLine1: sat.line1,
          tleLine2: sat.line2,
          target,
          satelliteSizeMeters: sat.sizeMeters,
        });

        const hasVisibleTransit = localGT.gridPoints.some(
          (p) => p.isTransitVisible,
        );
        if (!hasVisibleTransit) continue;

        const bestDist = haversineDistanceKm(input.observer, localGT.bestPoint);
        if (bestDist > input.radiusKm) continue;

        // Precise fine scan from the best ground track point
        const fineResult = fineScan({
          observer: { lat: localGT.bestPoint.lat, lon: localGT.bestPoint.lon },
          tleLine1: sat.line1,
          tleLine2: sat.line2,
          satelliteNoradId: sat.noradId,
          candidate,
          satelliteSizeMeters: sat.sizeMeters,
        });
        if (!fineResult?.transit) continue;

        // Full ground track for display
        const groundTrack = computeGroundTrack({
          center: input.observer,
          radiusKm: input.radiusKm,
          transitTime: fineResult.closestApproach.time,
          tleLine1: sat.line1,
          tleLine2: sat.line2,
          target,
          satelliteSizeMeters: sat.sizeMeters,
        });

        const event: TransitEvent = {
          id: `${sat.noradId}-${target}-${fineResult.closestApproach.time.getTime()}`,
          satellite: {
            name: sat.name,
            noradId: sat.noradId,
            angularDiameterArcsec:
              fineResult.closestApproach.satelliteAngularDiameterArcsec,
          },
          target,
          time: {
            utc: fineResult.closestApproach.time,
            durationMs: fineResult.transit.durationMs,
            entryUtc: fineResult.transit.entryTime,
            exitUtc: fineResult.transit.exitTime,
          },
          observationPoint: {
            lat: groundTrack.bestPoint.lat,
            lon: groundTrack.bestPoint.lon,
            distanceFromUserKm: haversineDistanceKm(
              input.observer,
              groundTrack.bestPoint,
            ),
          },
          targetBody: {
            altitudeDeg: fineResult.closestApproach.targetPosition.altitudeDeg,
            azimuthDeg: fineResult.closestApproach.targetPosition.azimuthDeg,
            angularDiameterArcsec:
              fineResult.closestApproach.targetAngularDiameterArcsec,
          },
          groundTrack: {
            centerline: groundTrack.centerline,
            corridorWidthKm: groundTrack.corridorWidthKm,
          },
          quality: computeQuality(
            fineResult.closestApproach.separationArcsec,
            target,
          ),
          minSeparationArcsec: fineResult.closestApproach.separationArcsec,
        };

        transits.push(event);
      }
    }
  }

  // Sort by quality score descending
  transits.sort((a, b) => b.quality.score - a.quality.score);

  const computeTimeMs = Date.now() - startTime;
  const suggestions = transits.length === 0 ? buildSuggestions(input) : null;

  return {
    meta: {
      location: input.observer,
      dateRange: {
        start: input.dateRange.start.toISOString(),
        end: input.dateRange.end.toISOString(),
      },
      radiusKm: input.radiusKm,
      computeTimeMs,
    },
    transits,
    suggestions,
  };
}

/**
 * Find the sample point with the smallest satellite-target angular separation.
 */
function findBestSamplePoint(
  samplePoints: readonly LatLon[],
  tleLine1: string,
  tleLine2: string,
  time: Date,
  target: TransitTarget,
): LatLon | null {
  const satResult = propagateSatellite(tleLine1, tleLine2, time);
  if (!satResult) return null;

  const getTargetPos = target === "sun" ? getSunPosition : getMoonPosition;
  const targetPos = getTargetPos(time, samplePoints[0]);

  let bestPoint: LatLon = samplePoints[0];
  let bestSep = Infinity;

  for (const point of samplePoints) {
    const satTopo = getTopocentricPosition(satResult.eci, time, point);
    if (satTopo.elevationDeg < 0) continue;

    const sep = angularSeparationDeg(satTopo, targetPos);
    if (sep < bestSep) {
      bestSep = sep;
      bestPoint = point;
    }
  }

  return bestPoint;
}

function computeQuality(
  minSepArcsec: number,
  target: TransitTarget,
): { score: number; notes: string } {
  // Score 0-100 based on how close to center the transit passes
  // 0 arcsec separation = score 100 (dead center)
  const targetRadiusArcsec = target === "sun" ? 960 : 930;
  const normalized = Math.max(0, 1 - minSepArcsec / targetRadiusArcsec);
  const score = Math.round(normalized * 100);

  let notes = "";
  if (score >= 80) notes = "Excellent central transit";
  else if (score >= 50) notes = "Good transit visibility";
  else notes = "Grazing transit";

  return { score, notes };
}

function buildSuggestions(input: SearchInput): SearchSuggestions {
  const rangeDays = Math.round(
    (input.dateRange.end.getTime() - input.dateRange.start.getTime()) /
      (24 * 60 * 60 * 1000),
  );

  const suggestions: SearchSuggestions = {};

  if (input.radiusKm < 100) {
    (suggestions as Record<string, unknown>).increaseRadius = {
      suggestedKm: Math.min(input.radiusKm * 3, 500),
      reason: "A wider travel radius increases the chance of finding a transit path",
    };
  }

  if (rangeDays < 60) {
    const newEnd = new Date(input.dateRange.end.getTime() + 30 * 24 * 60 * 60 * 1000);
    (suggestions as Record<string, unknown>).extendDateRange = {
      suggestedEnd: newEnd.toISOString(),
      reason: "Extending the search period increases the chance of finding a transit",
    };
  }

  return suggestions;
}
