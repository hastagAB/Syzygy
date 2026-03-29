# S007 - Transit Detector (Coarse Scan)

**Phase:** 1 | **Depends on:** S003, S004, S005, S006 | **Priority:** P0

## What
Implement the coarse scan phase of the transit detection algorithm (ARCHITECTURE.md Section 6, Phase 1). For a given observer location, satellite TLE, date range, and target body (Sun/Moon), scan at 10-second intervals to find candidate windows where the satellite's angular separation from the target body is less than 2 degrees. Apply early-exit optimizations: skip when satellite is below horizon, skip nighttime for solar transits.

## Files
- Create: `src/lib/engine/transit-detector.ts`
- Create: `tests/unit/engine/transit-detector.test.ts`

## Tests
- `should_find_candidate_window_for_known_transit` - use a known ISS transit event; coarse scan should flag a candidate window containing the transit time
- `should_skip_nighttime_for_solar_transits` - verify no candidates when Sun is below horizon
- `should_skip_when_satellite_below_horizon` - observer can't see satellite
- `should_return_empty_when_no_candidates` - short date range with no transits

## Acceptance
- [ ] Tests pass
- [ ] Coarse scan at 10-second intervals (configurable)
- [ ] Candidate threshold: < 2 degrees angular separation (configurable)
- [ ] Early exit: satellite below horizon, target below 5 degrees altitude
- [ ] Returns candidate windows as time ranges, not individual points
- [ ] Performance: 30-day scan for ISS completes in < 10 seconds
