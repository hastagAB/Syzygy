# S006 - Geometry Module

**Phase:** 1 | **Depends on:** S002 | **Priority:** P0

## What
Core geometric calculations: angular separation between two sky positions, great-circle distance (Haversine), ECI-to-geodetic conversion helpers, and degree/radian utilities. This is the mathematical foundation shared by the transit detector and ground track calculator.

## Files
- Create: `src/lib/engine/geometry.ts`
- Create: `tests/unit/engine/geometry.test.ts`

## Tests
- `should_compute_angular_separation_zero_when_same_point` - two identical az/alt pairs yield 0
- `should_compute_angular_separation_known_pair` - verify against hand-calculated value
- `should_compute_haversine_distance_known_cities` - e.g., London to Paris ~343 km
- `should_handle_antimeridian_crossing` - longitude wrapping (-180/180)
- `should_convert_degrees_radians_roundtrip` - no precision loss

## Acceptance
- [ ] Tests pass
- [ ] Angular separation formula matches ARCHITECTURE.md Section 6
- [ ] Haversine matches ARCHITECTURE.md Appendix
- [ ] All angles handled in radians internally, degrees at API boundaries
- [ ] No floating-point edge cases (NaN, division by zero at poles)
