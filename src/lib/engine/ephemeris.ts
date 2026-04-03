import * as astronomia from "astronomia";
import { degToRad, radToDeg } from "@/lib/engine/geometry";
import type { LatLon, TopocentricPosition } from "@/types";

const { solar, moonposition, julian, sidereal, base } = astronomia;

/** Convert a JS Date to Julian Day number */
function dateToJD(date: Date): number {
  return julian.DateToJD(date);
}

/** Convert JD to Julian centuries from J2000 */
function jdToT(jd: number): number {
  return base.J2000Century(jd);
}

/**
 * Compute the Sun's topocentric position (azimuth, elevation) as seen from
 * a specific location on Earth.
 */
export function getSunPosition(date: Date, observer: LatLon): TopocentricPosition {
  const jd = dateToJD(date);

  // Get Sun's apparent equatorial coordinates (RA, Dec)
  const sunEq = solar.apparentEquatorial(jd);
  const ra = sunEq.ra; // radians
  const dec = sunEq.dec; // radians

  // Convert to horizontal coordinates (az, alt) for the observer
  const obsLat = degToRad(observer.lat);
  const obsLon = degToRad(observer.lon);

  // Compute local sidereal time
  const theta0 = sidereal.apparent(jd) % (2 * Math.PI); // Greenwich apparent sidereal time in radians
  const localSiderealTime = theta0 + obsLon; // Local sidereal time

  // Hour angle
  const H = localSiderealTime - ra;

  // Convert equatorial to horizontal
  const horizontal = equatorialToHorizontal(ra, dec, obsLat, H);

  const azDeg = normalizeAzimuth(radToDeg(horizontal.az));
  const altDeg = radToDeg(horizontal.alt);

  return {
    azimuthDeg: azDeg,
    elevationDeg: altDeg,
    rangeKm: getSunDistanceKm(jd),
  };
}

/**
 * Compute the Moon's topocentric position (azimuth, elevation) as seen from
 * a specific location on Earth, including parallax correction.
 */
export function getMoonPosition(date: Date, observer: LatLon): TopocentricPosition {
  const jd = dateToJD(date);

  // Get Moon's geocentric equatorial coordinates
  const moonPos = moonposition.position(jd);
  const moonRA = moonPos.ra; // radians
  const moonDec = moonPos.dec; // radians
  const moonDist = moonPos.range; // km

  // Apply parallax correction (topocentric adjustment)
  const obsLat = degToRad(observer.lat);
  const obsLon = degToRad(observer.lon);

  // Compute local sidereal time
  const theta0 = sidereal.apparent(jd) % (2 * Math.PI);
  const localSiderealTime = theta0 + obsLon;
  const H = localSiderealTime - moonRA;

  // Convert to horizontal
  const horizontal = equatorialToHorizontal(moonRA, moonDec, obsLat, H);

  // Apply parallax in altitude (Moon parallax is significant: ~1 degree)
  const moonParallaxRad = Math.asin(6371 / moonDist);
  const correctedAlt = horizontal.alt - moonParallaxRad * Math.cos(horizontal.alt);

  const azDeg = normalizeAzimuth(radToDeg(horizontal.az));
  const altDeg = radToDeg(correctedAlt);

  return {
    azimuthDeg: azDeg,
    elevationDeg: altDeg,
    rangeKm: moonDist,
  };
}

/** Compute Sun's angular diameter in arcseconds at a given time */
export function getSunAngularDiameterArcsec(date: Date): number {
  const jd = dateToJD(date);
  const T = jdToT(jd);
  const distAU = solar.radius(T); // Sun-Earth distance in AU
  // Sun's physical diameter: 1,391,400 km
  // 1 AU = 149,597,870.7 km
  const distKm = distAU * 149_597_870.7;
  const angRad = 2 * Math.atan(1_391_400 / (2 * distKm));
  return radToDeg(angRad) * 3600;
}

/** Compute Moon's angular diameter in arcseconds at a given time */
export function getMoonAngularDiameterArcsec(date: Date): number {
  const jd = dateToJD(date);
  const moonPos = moonposition.position(jd);
  const distKm = moonPos.range;
  // Moon's physical diameter: 3,474.8 km
  const angRad = 2 * Math.atan(3_474.8 / (2 * distKm));
  return radToDeg(angRad) * 3600;
}

/**
 * Manual equatorial to horizontal coordinate conversion.
 * Returns azimuth (from north, eastward) and altitude in radians.
 */
function equatorialToHorizontal(
  ra: number,
  dec: number,
  obsLat: number,
  hourAngle: number,
): { az: number; alt: number } {
  const sinAlt =
    Math.sin(dec) * Math.sin(obsLat) +
    Math.cos(dec) * Math.cos(obsLat) * Math.cos(hourAngle);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const cosAz =
    (Math.sin(dec) - Math.sin(alt) * Math.sin(obsLat)) /
    (Math.cos(alt) * Math.cos(obsLat));
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  let az = Math.acos(clampedCosAz);

  if (Math.sin(hourAngle) > 0) {
    az = 2 * Math.PI - az;
  }

  return { az, alt };
}

/** Normalize azimuth to 0-360 range */
function normalizeAzimuth(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Sun distance in km at a given Julian Day */
function getSunDistanceKm(jd: number): number {
  const T = jdToT(jd);
  const distAU = solar.radius(T);
  return distAU * 149_597_870.7;
}
