/** Satellite and TLE types */

export interface TLERecord {
  readonly name: string;
  readonly noradId: number;
  readonly line1: string;
  readonly line2: string;
  readonly epoch: Date;
}

export type SatelliteDifficulty = "easy" | "medium" | "hard";

export interface SatelliteInfo {
  readonly id: string;
  readonly name: string;
  readonly noradId: number;
  readonly sizeMeters: number;
  readonly difficulty: SatelliteDifficulty;
  readonly description: string;
}
