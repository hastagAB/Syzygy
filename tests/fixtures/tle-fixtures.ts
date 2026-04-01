/**
 * Real ISS TLE data for testing.
 * Source: CelesTrak, captured for unit test fixtures.
 * These are real historical TLEs - do not modify the line1/line2 values.
 */

/** ISS TLE from early 2024 - used for basic parsing and propagation tests */
export const ISS_TLE_FIXTURE = {
  name: "ISS (ZARYA)",
  line1: "1 25544U 98067A   24045.51750649  .00016717  00000-0  30009-3 0  9993",
  line2: "2 25544  51.6418 291.1225 0004866 293.2685 133.5735 15.49911407440412",
};

/** HST TLE for testing multiple satellite support */
export const HST_TLE_FIXTURE = {
  name: "HST",
  line1: "1 20580U 90037B   24045.18074774  .00001026  00000-0  56023-4 0  9998",
  line2: "2 20580  28.4699 100.9282 0002653 113.5456 246.5691 15.09913987878805",
};

/** Raw 3-line TLE text as returned by CelesTrak */
export const ISS_TLE_RAW_TEXT = `ISS (ZARYA)
1 25544U 98067A   24045.51750649  .00016717  00000-0  30009-3 0  9993
2 25544  51.6418 291.1225 0004866 293.2685 133.5735 15.49911407440412`;

/** Malformed TLE for error handling tests */
export const MALFORMED_TLE_TEXT = `ISS (ZARYA)
1 25544U 98067A   24045.51750649
2 25544  51.6418 291.1225`;

/** Multiple satellites in one response */
export const MULTI_SAT_TLE_RAW = `ISS (ZARYA)
1 25544U 98067A   24045.51750649  .00016717  00000-0  30009-3 0  9993
2 25544  51.6418 291.1225 0004866 293.2685 133.5735 15.49911407440412
HST
1 20580U 90037B   24045.18074774  .00001026  00000-0  56023-4 0  9998
2 20580  28.4699 100.9282 0002653 113.5456 246.5691 15.09913987878805`;
