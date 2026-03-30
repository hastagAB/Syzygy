/** Transit search and result types */

import type { LatLon } from "./geo";

export type TransitTarget = "sun" | "moon";

export interface SearchParams {
  readonly location: LatLon;
  readonly dateRange: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly radiusKm: number;
  readonly satellites: readonly string[];
  readonly targets: readonly TransitTarget[];
}

export interface CandidateWindow {
  readonly start: Date;
  readonly end: Date;
  readonly minSeparationDeg: number;
  readonly target: TransitTarget;
  readonly satelliteNoradId: number;
}

export interface TransitEvent {
  readonly id: string;
  readonly satellite: {
    readonly name: string;
    readonly noradId: number;
    readonly angularDiameterArcsec: number;
  };
  readonly target: TransitTarget;
  readonly time: {
    readonly utc: Date;
    readonly durationMs: number;
    readonly entryUtc: Date;
    readonly exitUtc: Date;
  };
  readonly observationPoint: LatLon & {
    readonly distanceFromUserKm: number;
  };
  readonly targetBody: {
    readonly altitudeDeg: number;
    readonly azimuthDeg: number;
    readonly angularDiameterArcsec: number;
  };
  readonly groundTrack: {
    readonly centerline: readonly LatLon[];
    readonly corridorWidthKm: number;
  };
  readonly quality: {
    readonly score: number;
    readonly notes: string;
  };
  readonly minSeparationArcsec: number;
}

export interface SearchSuggestions {
  readonly increaseRadius?: {
    readonly suggestedKm: number;
    readonly reason: string;
  };
  readonly extendDateRange?: {
    readonly suggestedEnd: string;
    readonly reason: string;
  };
}

export interface SearchResult {
  readonly meta: {
    readonly location: LatLon;
    readonly dateRange: { readonly start: string; readonly end: string };
    readonly radiusKm: number;
    readonly computeTimeMs: number;
    readonly tleEpoch: string;
  };
  readonly transits: readonly TransitEvent[];
  readonly suggestions: SearchSuggestions | null;
}
