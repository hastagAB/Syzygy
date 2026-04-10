/**
 * Known transit events for e2e validation.
 * These are engine-verified events used for regression testing.
 * The TLE epoch must be close to the transit time for accuracy.
 */

export interface KnownTransitFixture {
  readonly description: string;
  readonly satellite: {
    readonly name: string;
    readonly noradId: number;
    readonly line1: string;
    readonly line2: string;
  };
  readonly target: "sun" | "moon";
  readonly observer: { readonly lat: number; readonly lon: number };
  readonly searchWindow: {
    readonly start: string;
    readonly end: string;
  };
  readonly expectation:
    | { readonly type: "candidates_found"; readonly minCandidates: number }
    | { readonly type: "no_candidates" };
}

/**
 * ISS daytime pass near Sun from Milan - engine should find candidate windows
 * when using a relaxed threshold. This validates the full pipeline.
 * TLE epoch: 2024-02-14 (~day 45)
 */
export const ISS_DAYTIME_PASS: KnownTransitFixture = {
  description: "ISS daytime pass near Sun from Milan, Feb 14-15 2024",
  satellite: {
    name: "ISS (ZARYA)",
    noradId: 25544,
    line1: "1 25544U 98067A   24045.51750649  .00016717  00000-0  30009-3 0  9993",
    line2: "2 25544  51.6418 291.1225 0004866 293.2685 133.5735 15.49911407440412",
  },
  target: "sun",
  observer: { lat: 45.4642, lon: 9.19 },
  searchWindow: {
    start: "2024-02-14T06:00:00Z",
    end: "2024-02-15T18:00:00Z",
  },
  expectation: { type: "candidates_found", minCandidates: 1 },
};

/**
 * ISS nighttime - no solar transit candidates should be found.
 */
export const ISS_NIGHTTIME_NO_TRANSIT: KnownTransitFixture = {
  description: "ISS during nighttime at Milan - no solar candidates",
  satellite: {
    name: "ISS (ZARYA)",
    noradId: 25544,
    line1: "1 25544U 98067A   24045.51750649  .00016717  00000-0  30009-3 0  9993",
    line2: "2 25544  51.6418 291.1225 0004866 293.2685 133.5735 15.49911407440412",
  },
  target: "sun",
  observer: { lat: 45.4642, lon: 9.19 },
  searchWindow: {
    start: "2024-02-14T22:00:00Z",
    end: "2024-02-15T04:00:00Z",
  },
  expectation: { type: "no_candidates" },
};

/**
 * ISS lunar pass from Milan - engine should find candidates with wide threshold.
 */
export const ISS_LUNAR_PASS: KnownTransitFixture = {
  description: "ISS pass near Moon from Milan, Feb 14-15 2024",
  satellite: {
    name: "ISS (ZARYA)",
    noradId: 25544,
    line1: "1 25544U 98067A   24045.51750649  .00016717  00000-0  30009-3 0  9993",
    line2: "2 25544  51.6418 291.1225 0004866 293.2685 133.5735 15.49911407440412",
  },
  target: "moon",
  observer: { lat: 45.4642, lon: 9.19 },
  searchWindow: {
    start: "2024-02-14T00:00:00Z",
    end: "2024-02-16T00:00:00Z",
  },
  expectation: { type: "candidates_found", minCandidates: 1 },
};
