# S011 - TLE Cache with TTL

**Phase:** 2 | **Depends on:** S003 | **Priority:** P0

## What
In-memory TLE cache that stores fetched TLEs and respects a configurable TTL (default 2 hours). Prevents repeated HTTP calls to CelesTrak during a search session.

## Files
- Create: `src/lib/data/tle-cache.ts`
- Create: `tests/unit/data/tle-cache.test.ts`

## Tests
- `should_cache_tle_and_return_on_subsequent_calls`
- `should_expire_after_ttl`
- `should_fetch_fresh_tle_when_cache_miss`

## Acceptance
- [ ] Tests pass
- [ ] TTL configurable via config
- [ ] Cache keyed by NORAD ID
