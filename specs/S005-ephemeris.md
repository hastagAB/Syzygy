# S005 - Sun/Moon Ephemeris

**Phase:** 1 | **Depends on:** S002 | **Priority:** P0

## What
Compute the Sun and Moon positions (right ascension, declination, distance) at a given time using the `astronomia` library. Convert to topocentric coordinates (azimuth, altitude) for a given observer location. Compute angular diameters for both bodies. Moon parallax correction is critical - the Moon is close enough that topocentric vs geocentric makes a significant difference.

## Files
- Create: `src/lib/engine/ephemeris.ts`
- Create: `tests/unit/engine/ephemeris.test.ts`

## Tests
- `should_compute_sun_position_at_known_time` - verify Sun az/alt against a known reference (e.g., USNO data for a specific date/location)
- `should_compute_moon_position_at_known_time` - verify Moon az/alt with parallax correction
- `should_compute_angular_diameter_of_sun` - expect ~1891 arcseconds (varies slightly with Earth-Sun distance)
- `should_compute_angular_diameter_of_moon` - expect ~1800-2000 arcseconds (varies with distance)
- `should_return_negative_altitude_when_below_horizon` - Sun at midnight

## Acceptance
- [ ] Tests pass
- [ ] Sun position accurate to < 0.1 degree (sufficient for transit detection)
- [ ] Moon position includes parallax correction
- [ ] Angular diameters computed from actual distances, not hardcoded
- [ ] Uses `astronomia` APIs correctly (verified against library docs)
