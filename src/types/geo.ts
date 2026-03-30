/** Geographic coordinate types */

export interface LatLon {
  readonly lat: number;
  readonly lon: number;
}

export interface LatLonAlt extends LatLon {
  readonly altKm: number;
}

/** Topocentric position as seen from an observer on Earth's surface */
export interface TopocentricPosition {
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
  readonly rangeKm: number;
}

/** Earth-Centered Inertial coordinates (km) */
export interface ECIPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** ECI velocity (km/s) */
export interface ECIVelocity {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface BoundingBox {
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
}
