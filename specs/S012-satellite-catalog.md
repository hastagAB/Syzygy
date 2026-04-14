# S012 - Satellite Catalog

**Phase:** 2 | **Depends on:** S002 | **Priority:** P0

## What
Static satellite catalog with ISS, Hubble, and Tiangong data (NORAD IDs, names, physical sizes). Exported as a typed array for UI dropdowns and engine lookups.

## Files
- Create: `src/lib/data/satellite-catalog.ts`
- Create: `tests/unit/data/satellite-catalog.test.ts`

## Tests
- `should_contain_iss_hubble_tiangong`
- `should_have_valid_norad_ids`
- `should_lookup_by_norad_id`

## Acceptance
- [ ] Tests pass
- [ ] Each entry has: name, noradId, sizeMeters, difficulty
