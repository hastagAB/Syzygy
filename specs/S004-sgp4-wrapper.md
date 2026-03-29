# S004 - SGP4 Propagation Wrapper

**Phase:** 1 | **Depends on:** S002 | **Priority:** P0

## What
Wrap `satellite.js` to propagate a satellite's position from TLE data at a given time. Input: TLE lines + Date. Output: position in ECI (Earth-Centered Inertial) and geodetic (lat, lon, altitude) coordinates, plus topocentric (azimuth, elevation, range) from an observer location.

## Files
- Create: `src/lib/engine/sgp4.ts`
- Create: `tests/unit/engine/sgp4.test.ts`

## Tests
- `should_propagate_iss_position_at_known_epoch` - propagate ISS TLE at its epoch, verify position is plausible (altitude ~400-420 km, lat within inclination bounds)
- `should_compute_topocentric_from_observer` - given observer lat/lon and satellite ECI, compute az/el/range
- `should_return_error_for_decayed_tle` - TLE too old, propagation fails gracefully

## Acceptance
- [ ] Tests pass
- [ ] Uses `satellite.js` APIs correctly (verified against library docs)
- [ ] Returns typed results, not raw satellite.js objects
- [ ] Handles SGP4 propagation errors (bad TLE, epoch too far)
