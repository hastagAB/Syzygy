# S008 - Transit Detector (Fine Scan)

**Phase:** 1 | **Depends on:** S007 | **Priority:** P0

## What
Implement the fine scan phase (ARCHITECTURE.md Section 6, Phase 2). For each candidate window from the coarse scan, refine at 0.1-second intervals to determine if an actual transit occurs (angular separation < target body's angular radius). Record transit entry time, exit time, minimum separation, and duration.

## Files
- Modify: `src/lib/engine/transit-detector.ts`
- Create: `tests/unit/engine/transit-detector-fine.test.ts`

## Tests
- `should_detect_transit_within_candidate_window` - given a candidate window containing a known transit, fine scan detects it with sub-second entry/exit times
- `should_compute_transit_duration` - exit time minus entry time matches expected duration (< 2 seconds for ISS)
- `should_reject_near_miss` - candidate window where satellite passes close but does NOT transit (separation > angular radius)
- `should_record_minimum_separation` - the closest approach point within the transit

## Acceptance
- [ ] Tests pass
- [ ] Fine scan at 0.1-second intervals (configurable)
- [ ] Transit detected when separation < (target angular radius + satellite angular radius)
- [ ] Returns TransitEvent with: entry/exit time, duration, min separation, satellite angular diameter
- [ ] Integrates with coarse scan as a pipeline: coarseScan() -> fineScan()
