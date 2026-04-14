import { coarseScan, fineScan } from "@/lib/engine/transit-detector";
import { computeGroundTrack } from "@/lib/engine/ground-track";
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
 * coarse scan -> fine scan -> ground track for each satellite/target combo.
 */
export function searchTransits(input: SearchInput): SearchOutput {
  const startTime = Date.now();
  const transits: TransitEvent[] = [];

  for (const satellite of input.satellites) {
    for (const target of input.targets) {
      const candidates = coarseScan({
        observer: input.observer,
        tleLine1: satellite.line1,
        tleLine2: satellite.line2,
        satelliteNoradId: satellite.noradId,
        target,
        start: input.dateRange.start,
        end: input.dateRange.end,
        thresholdDeg: DEFAULT_CANDIDATE_THRESHOLD_DEG,
      });

      for (const candidate of candidates) {
        const fineResult = fineScan({
          observer: input.observer,
          tleLine1: satellite.line1,
          tleLine2: satellite.line2,
          satelliteNoradId: satellite.noradId,
          candidate,
          satelliteSizeMeters: satellite.sizeMeters,
        });

        if (!fineResult?.transit) continue;

        const groundTrack = computeGroundTrack({
          center: input.observer,
          radiusKm: input.radiusKm,
          transitTime: fineResult.closestApproach.time,
          tleLine1: satellite.line1,
          tleLine2: satellite.line2,
          target,
          satelliteSizeMeters: satellite.sizeMeters,
        });

        const event: TransitEvent = {
          id: `${satellite.noradId}-${target}-${fineResult.closestApproach.time.getTime()}`,
          satellite: {
            name: satellite.name,
            noradId: satellite.noradId,
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
            distanceFromUserKm: 0,
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
          quality: computeQuality(fineResult.closestApproach.separationArcsec, target),
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
