import { propagateSatellite, getTopocentricPosition } from "@/lib/engine/sgp4";
import {
  getSunPosition,
  getMoonPosition,
  getSunAngularDiameterArcsec,
  getMoonAngularDiameterArcsec,
} from "@/lib/engine/ephemeris";
import {
  angularSeparationDeg,
  satelliteAngularDiameterArcsec,
} from "@/lib/engine/geometry";
import {
  DEFAULT_COARSE_INTERVAL_SEC,
  DEFAULT_CANDIDATE_THRESHOLD_DEG,
  DEFAULT_FINE_INTERVAL_SEC,
  DEFAULT_SATELLITE_SIZE_METERS,
  MIN_TARGET_ALTITUDE_DEG,
} from "@/lib/config";
import type { LatLon } from "@/types";
import type { TransitTarget, CandidateWindow } from "@/types/transit";

export interface CoarseScanOptions {
  readonly observer: LatLon;
  readonly observers?: readonly LatLon[];
  readonly tleLine1: string;
  readonly tleLine2: string;
  readonly satelliteNoradId: number;
  readonly target: TransitTarget;
  readonly start: Date;
  readonly end: Date;
  readonly intervalSec?: number;
  readonly thresholdDeg?: number;
}

interface SatellitePass {
  readonly riseTime: number;
  readonly setTime: number;
}

/**
 * Phase 1: Find all satellite passes above the horizon.
 * Scans at 60-second intervals to detect rise/set windows.
 */
function findSatellitePasses(
  tleLine1: string,
  tleLine2: string,
  observer: LatLon,
  start: Date,
  end: Date,
): SatellitePass[] {
  const passes: SatellitePass[] = [];
  const stepMs = 60_000; // 60s intervals
  let passStart: number | null = null;

  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    const date = new Date(t);
    const satResult = propagateSatellite(tleLine1, tleLine2, date);

    if (!satResult) {
      if (passStart !== null) {
        passes.push({ riseTime: passStart, setTime: t - stepMs });
        passStart = null;
      }
      continue;
    }

    const topo = getTopocentricPosition(satResult.eci, date, observer);

    if (topo.elevationDeg > -5) {
      if (passStart === null) passStart = t;
    } else {
      if (passStart !== null) {
        passes.push({ riseTime: passStart, setTime: t - stepMs });
        passStart = null;
      }
    }
  }

  if (passStart !== null) {
    passes.push({ riseTime: passStart, setTime: end.getTime() });
  }

  return passes;
}

/**
 * Coarse scan phase of transit detection.
 * Two-phase approach for performance:
 * 1. Find satellite passes above the horizon (60s intervals)
 * 2. Check target proximity only during passes (configurable intervals)
 * Supports multiple observer points for area-based detection.
 */
export function coarseScan(options: CoarseScanOptions): CandidateWindow[] {
  const {
    observer,
    observers,
    tleLine1,
    tleLine2,
    satelliteNoradId,
    target,
    start,
    end,
    intervalSec = DEFAULT_COARSE_INTERVAL_SEC,
    thresholdDeg = DEFAULT_CANDIDATE_THRESHOLD_DEG,
  } = options;

  const allObservers = observers && observers.length > 0 ? observers : [observer];

  // Phase 1: Find all satellite passes above the horizon
  const passes = findSatellitePasses(tleLine1, tleLine2, observer, start, end);

  // Phase 2: For each pass, scan at fine intervals for target proximity
  const intervalMs = intervalSec * 1000;
  const candidates: CandidateWindow[] = [];
  const getTargetPosition = target === "sun" ? getSunPosition : getMoonPosition;

  for (const pass of passes) {
    // Expand pass window by 60s on each side to catch edges
    const passStart = pass.riseTime - 60_000;
    const passEnd = pass.setTime + 60_000;

    let windowStart: Date | null = null;
    let windowEnd: Date | null = null;
    let windowMinSep = Infinity;

    for (let t = passStart; t <= passEnd; t += intervalMs) {
      const date = new Date(t);

      const satResult = propagateSatellite(tleLine1, tleLine2, date);
      if (!satResult) {
        closePassWindow();
        continue;
      }

      // Get target body position (from center observer)
      const targetPos = getTargetPosition(date, allObservers[0]);

      // Early exit: target below minimum altitude
      if (targetPos.elevationDeg < MIN_TARGET_ALTITUDE_DEG) {
        closePassWindow();
        continue;
      }

      // Check separation from each observer point
      let minSepThisStep = Infinity;

      for (const obs of allObservers) {
        const satTopo = getTopocentricPosition(satResult.eci, date, obs);
        if (satTopo.elevationDeg < 0) continue;

        const separation = angularSeparationDeg(satTopo, targetPos);
        minSepThisStep = Math.min(minSepThisStep, separation);

        // Early exit: already below threshold, no need to check more observers
        if (minSepThisStep < thresholdDeg) break;
      }

      if (minSepThisStep < thresholdDeg) {
        if (!windowStart) {
          windowStart = date;
        }
        windowEnd = date;
        windowMinSep = Math.min(windowMinSep, minSepThisStep);
      } else {
        closePassWindow();
      }
    }

    closePassWindow();

    function closePassWindow(): void {
      if (windowStart && windowEnd) {
        candidates.push({
          start: windowStart,
          end: windowEnd,
          minSeparationDeg: windowMinSep,
          target,
          satelliteNoradId,
        });
      }
      windowStart = null;
      windowEnd = null;
      windowMinSep = Infinity;
    }
  }

  return candidates;
}

export interface FineScanOptions {
  readonly observer: LatLon;
  readonly tleLine1: string;
  readonly tleLine2: string;
  readonly satelliteNoradId: number;
  readonly candidate: CandidateWindow;
  readonly intervalSec?: number;
  readonly satelliteSizeMeters?: number;
}

export interface ClosestApproach {
  readonly time: Date;
  readonly separationArcsec: number;
  readonly satelliteAngularDiameterArcsec: number;
  readonly targetAngularDiameterArcsec: number;
  readonly targetPosition: {
    readonly altitudeDeg: number;
    readonly azimuthDeg: number;
  };
}

export interface FineScanResult {
  readonly closestApproach: ClosestApproach;
  readonly transit: {
    readonly entryTime: Date;
    readonly exitTime: Date;
    readonly durationMs: number;
  } | null;
}

/**
 * Fine scan phase of transit detection.
 * Refines candidate windows at 0.1-second intervals to detect actual transits
 * and record closest approach data.
 */
export function fineScan(options: FineScanOptions): FineScanResult | null {
  const {
    observer,
    tleLine1,
    tleLine2,
    candidate,
    intervalSec = DEFAULT_FINE_INTERVAL_SEC,
    satelliteSizeMeters = DEFAULT_SATELLITE_SIZE_METERS,
  } = options;

  const intervalMs = intervalSec * 1000;
  const target = candidate.target;
  const getTargetPosition = target === "sun" ? getSunPosition : getMoonPosition;
  const getTargetDiameter =
    target === "sun" ? getSunAngularDiameterArcsec : getMoonAngularDiameterArcsec;

  // Expand window by 10 seconds on each side to catch transit edges
  const windowStart = candidate.start.getTime() - 10_000;
  const windowEnd = candidate.end.getTime() + 10_000;

  let minSep = Infinity;
  let minSepTime: Date | null = null;
  let targetPosAtClosest: { altitudeDeg: number; azimuthDeg: number } | null = null;
  let satDiamAtClosest = 0;
  let targetDiamAtClosest = 0;

  let entryTime: Date | null = null;
  let exitTime: Date | null = null;

  for (let t = windowStart; t <= windowEnd; t += intervalMs) {
    const date = new Date(t);

    const satResult = propagateSatellite(tleLine1, tleLine2, date);
    if (!satResult) continue;

    const satTopo = getTopocentricPosition(satResult.eci, date, observer);
    if (satTopo.elevationDeg < 0) continue;

    const targetPos = getTargetPosition(date, observer);
    const separation = angularSeparationDeg(satTopo, targetPos);
    const separationArcsec = separation * 3600;

    const satDiam = satelliteAngularDiameterArcsec(satelliteSizeMeters, satTopo.rangeKm);
    const targetDiam = getTargetDiameter(date);
    const transitThresholdArcsec = (targetDiam + satDiam) / 2;

    if (separationArcsec < minSep) {
      minSep = separationArcsec;
      minSepTime = date;
      targetPosAtClosest = {
        altitudeDeg: targetPos.elevationDeg,
        azimuthDeg: targetPos.azimuthDeg,
      };
      satDiamAtClosest = satDiam;
      targetDiamAtClosest = targetDiam;
    }

    if (separationArcsec < transitThresholdArcsec) {
      if (!entryTime) entryTime = date;
      exitTime = date;
    }
  }

  if (!minSepTime || !targetPosAtClosest) {
    return null;
  }

  return {
    closestApproach: {
      time: minSepTime,
      separationArcsec: minSep,
      satelliteAngularDiameterArcsec: satDiamAtClosest,
      targetAngularDiameterArcsec: targetDiamAtClosest,
      targetPosition: targetPosAtClosest,
    },
    transit:
      entryTime && exitTime
        ? {
            entryTime,
            exitTime,
            durationMs: exitTime.getTime() - entryTime.getTime(),
          }
        : null,
  };
}
