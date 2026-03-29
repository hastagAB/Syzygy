# S010 - Phase 1 E2E: Validate Against Known ISS Transit

**Phase:** 1 | **Depends on:** S007, S008 | **Priority:** P0

## What
The Phase 1 definition-of-done test. Given a documented real-world ISS transit (date, observer location, transit type), run the full engine pipeline (TLE fetch -> SGP4 -> ephemeris -> coarse scan -> fine scan) and verify the engine predicts a transit within acceptable tolerances. This uses real (fixture) TLE data, not mocks.

## Files
- Create: `tests/e2e/phase1-engine-validation.test.ts`
- Create: `tests/fixtures/known-transits.ts` (documented transit events with sources)

## Tests
- `should_predict_known_iss_solar_transit` - engine predicts a transit within +/- 5 seconds of the documented time and within 10 km of the documented location
- `should_predict_known_iss_lunar_transit` - same validation for a lunar transit
- `should_report_no_transit_for_wrong_location` - same time, location 100 km away from transit path, engine finds no transit from that point

## Acceptance
- [ ] Tests pass using fixture TLE data (no network calls)
- [ ] Transit time accuracy: within +/- 5 seconds of documented event
- [ ] Transit location: observation point within 10 km of documented position
- [ ] False positive check: no spurious transits detected in the same time window
- [ ] This test is the Phase 1 gate - nothing moves to Phase 2 until it's green
