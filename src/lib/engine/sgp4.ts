import * as satellite from "satellite.js";
import { degToRad, radToDeg } from "@/lib/engine/geometry";
import type { ECIPosition, LatLonAlt, TopocentricPosition, LatLon } from "@/types";

const satrecCache = new Map<string, satellite.SatRec>();

function getSatrec(tleLine1: string, tleLine2: string): satellite.SatRec {
  let satrec = satrecCache.get(tleLine1);
  if (!satrec) {
    satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    satrecCache.set(tleLine1, satrec);
  }
  return satrec;
}

export interface PropagationResult {
  readonly eci: ECIPosition;
  readonly velocity: { readonly x: number; readonly y: number; readonly z: number };
  readonly geodetic: LatLonAlt;
}

/**
 * Propagate a satellite's position from TLE data at a given time.
 * Returns ECI position, velocity, and geodetic coordinates, or null on error.
 */
export function propagateSatellite(
  tleLine1: string,
  tleLine2: string,
  date: Date,
): PropagationResult | null {
  try {
    const satrec = getSatrec(tleLine1, tleLine2);
    const result = satellite.propagate(satrec, date);

    if (
      !result.position ||
      typeof result.position === "boolean" ||
      !result.velocity ||
      typeof result.velocity === "boolean"
    ) {
      return null;
    }

    const posEci = result.position as satellite.EciVec3<number>;
    const velEci = result.velocity as satellite.EciVec3<number>;

    if (isNaN(posEci.x) || isNaN(posEci.y) || isNaN(posEci.z)) {
      return null;
    }

    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(posEci, gmst);

    return {
      eci: { x: posEci.x, y: posEci.y, z: posEci.z },
      velocity: { x: velEci.x, y: velEci.y, z: velEci.z },
      geodetic: {
        lat: radToDeg(geo.latitude),
        lon: radToDeg(geo.longitude),
        altKm: geo.height,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Compute topocentric position (azimuth, elevation, range) of a satellite
 * as seen from an observer on Earth's surface.
 */
export function getTopocentricPosition(
  satEci: ECIPosition,
  date: Date,
  observer: LatLon,
): TopocentricPosition {
  const gmst = satellite.gstime(date);
  const obsRad = {
    longitude: degToRad(observer.lon),
    latitude: degToRad(observer.lat),
    height: 0,
  };

  const posEcf = satellite.eciToEcf(
    { x: satEci.x, y: satEci.y, z: satEci.z },
    gmst,
  );

  const lookAngles = satellite.ecfToLookAngles(obsRad, posEcf);

  return {
    azimuthDeg: radToDeg(lookAngles.azimuth),
    elevationDeg: radToDeg(lookAngles.elevation),
    rangeKm: lookAngles.rangeSat,
  };
}
