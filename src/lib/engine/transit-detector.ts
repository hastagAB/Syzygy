import { propagateSatellite, getTopocentricPosition } from "@/lib/engine/sgp4";
import { getSunPosition, getMoonPosition } from "@/lib/engine/ephemeris";
import { angularSeparationDeg } from "@/lib/engine/geometry";
import {
  DEFAULT_COARSE_INTERVAL_SEC,
  DEFAULT_CANDIDATE_THRESHOLD_DEG,
  MIN_TARGET_ALTITUDE_DEG,
} from "@/lib/config";
import type { LatLon } from "@/types";
import type { TransitTarget, CandidateWindow } from "@/types/transit";

export interface CoarseScanOptions {
  readonly observer: LatLon;
  readonly tleLine1: string;
  readonly tleLine2: string;
  readonly satelliteNoradId: number;
  readonly target: TransitTarget;
  readonly start: Date;
  readonly end: Date;
  readonly intervalSec?: number;
  readonly thresholdDeg?: number;
}

/**
 * Coarse scan phase of transit detection.
 * Scans at configurable intervals (default 10s) to find candidate windows
 * where the satellite's angular separation from the target body is below threshold.
 */
export function coarseScan(options: CoarseScanOptions): CandidateWindow[] {
  const {
    observer,
    tleLine1,
    tleLine2,
    satelliteNoradId,
    target,
    start,
    end,
    intervalSec = DEFAULT_COARSE_INTERVAL_SEC,
    thresholdDeg = DEFAULT_CANDIDATE_THRESHOLD_DEG,
  } = options;

  const intervalMs = intervalSec * 1000;
  const candidates: CandidateWindow[] = [];
  const getTargetPosition = target === "sun" ? getSunPosition : getMoonPosition;

  let windowStart: Date | null = null;
  let windowEnd: Date | null = null;
  let windowMinSep = Infinity;

  for (let t = start.getTime(); t <= end.getTime(); t += intervalMs) {
    const date = new Date(t);

    // Get target body position
    const targetPos = getTargetPosition(date, observer);

    // Early exit: target below minimum altitude
    if (targetPos.elevationDeg < MIN_TARGET_ALTITUDE_DEG) {
      closeWindow();
      continue;
    }

    // Propagate satellite
    const satResult = propagateSatellite(tleLine1, tleLine2, date);
    if (!satResult) {
      closeWindow();
      continue;
    }

    // Get satellite topocentric position
    const satTopo = getTopocentricPosition(satResult.eci, date, observer);

    // Early exit: satellite below horizon
    if (satTopo.elevationDeg < 0) {
      closeWindow();
      continue;
    }

    // Compute angular separation
    const separation = angularSeparationDeg(satTopo, targetPos);

    if (separation < thresholdDeg) {
      if (!windowStart) {
        windowStart = date;
      }
      windowEnd = date;
      windowMinSep = Math.min(windowMinSep, separation);
    } else {
      closeWindow();
    }
  }

  // Close any remaining open window
  closeWindow();

  return candidates;

  function closeWindow(): void {
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
