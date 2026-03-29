# S009 - Ground Track Calculator

**Phase:** 1 | **Depends on:** S008 | **Priority:** P1

## What
For a confirmed transit event, compute the ground track: the strip of Earth's surface from which the transit is visible. Sweep a grid of points within the user's travel radius, recompute angular separation for each, and identify the centerline (minimum separation) and visibility corridor (all points where a transit is visible).

## Files
- Create: `src/lib/engine/ground-track.ts`
- Create: `tests/unit/engine/ground-track.test.ts`

## Tests
- `should_compute_centerline_for_known_transit` - given a transit event, centerline passes through the expected observation point
- `should_compute_corridor_width` - corridor width is approximately 5-10 km for ISS solar transit
- `should_return_points_within_radius_only` - no ground track points outside the travel radius
- `should_handle_small_radius` - 10 km radius still produces a usable ground track

## Acceptance
- [ ] Tests pass
- [ ] Grid spacing: ~2 km (configurable)
- [ ] Returns: centerline (array of [lat, lon] points), corridor polygon, corridor width in km
- [ ] Centerline sorted west-to-east (or by transit time progression)
- [ ] Performance: 100 km radius sweep completes in < 3 seconds
