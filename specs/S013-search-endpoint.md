# S013 - Transit Search Endpoint

**Phase:** 2 | **Depends on:** S010, S011, S012 | **Priority:** P0

## What
POST /api/v1/transits/search - accepts location, date range, radius, satellites, targets. Runs the full pipeline (fetch TLE, coarse scan, fine scan, ground track) and returns SearchResult.

## Files
- Create: `src/app/api/v1/transits/search/route.ts`
- Create: `src/lib/engine/search-orchestrator.ts`
- Create: `tests/unit/engine/search-orchestrator.test.ts`

## Tests
- `should_orchestrate_full_search_pipeline`
- `should_return_empty_results_with_suggestions`
- `should_handle_multiple_satellites`

## Acceptance
- [ ] Tests pass
- [ ] Zod validation on request body
- [ ] Error shape: { error: { code, message, details } }
- [ ] Returns SearchResult type
