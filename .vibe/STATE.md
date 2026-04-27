# State

## Now
v1.0 feature-complete. All phases delivered. Production polish applied.
109 tests passing across 16 test files. Build clean.

## Last working state
All phases COMPLETE:
- Phase 1: Engine (S001-S010) - TLE, SGP4, ephemeris, geometry, transit detector, ground track
- Phase 2: API (S011-S015) - TLE cache, satellite catalog, search endpoint, geocode proxy, validation
- Phase 3: Map + Location (S017-S021) - Leaflet ESRI satellite tiles, geolocation, radius overlay
- Phase 4: Search + Results (S023-S028) - Search panel, results list, ground tracks, event details
- Phase 5: Polish - Production UI, filters, Google Maps navigation, duration display, accuracy audit

## Active constraints
- All computation server-side (Next.js API routes)
- TLEs from CelesTrak only (no Space-Track account needed)
- No database - in-memory TLE cache only
- No user accounts or authentication

## Known issues
- Transit detection depends on TLE freshness (2-hour cache TTL)
- Single-threaded search - large radius + long date range can take 5-30s

## Do not touch without ADR
- Transit detection algorithm (ARCHITECTURE.md Section 6)
- API response contracts (ARCHITECTURE.md Section 8)
