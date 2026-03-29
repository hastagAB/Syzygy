# S003 - TLE Fetcher + Parser

**Phase:** 1 | **Depends on:** S002 | **Priority:** P0

## What
Fetch TLE data from CelesTrak for a given NORAD catalog number. Parse the 3-line TLE format (name + line1 + line2) into structured `TLERecord` objects. Handle HTTP errors and malformed TLE data gracefully.

## Files
- Create: `src/lib/data/tle-fetcher.ts`
- Create: `tests/unit/data/tle-fetcher.test.ts`
- Create: `tests/fixtures/tle-iss.txt` (snapshot of real ISS TLE)

## Tests
- `should_parse_valid_tle_lines` - parse a known ISS TLE fixture into TLERecord
- `should_reject_malformed_tle` - missing line, wrong checksum, truncated data
- `should_fetch_tle_from_celestrak` - integration test with mocked HTTP (no real network calls in unit tests)

## Acceptance
- [ ] Tests pass
- [ ] Parses real CelesTrak TLE format correctly
- [ ] Returns typed error for HTTP failures (not throws)
- [ ] No hardcoded URLs (use config)
- [ ] User-Agent header set per CelesTrak policy
