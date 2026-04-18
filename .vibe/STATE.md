# State

## Now
Phase 3-4 (Frontend + API wiring). Core engine + API + UI components all built.
Next: S027 (ground track map rendering), S030+ (Polish phase).

## Last working state
Commit 98499be - Full app builds and runs. 87 tests green, 15 test files.
- Phase 1 COMPLETE: Engine (S001-S010) - TLE, SGP4, ephemeris, geometry, transit detector, ground track
- Phase 2 COMPLETE: API (S011-S014) - TLE cache, satellite catalog, search endpoint, geocode proxy
- Phase 3-4 IN PROGRESS: UI (S017-S025) - Search panel, results list, Leaflet map, Zustand store

## Active constraints
- All computation server-side (Next.js API routes)
- TLEs from CelesTrak only (no Space-Track account needed)
- No database - in-memory cache only
- No user accounts or authentication
- Windows development environment (PowerShell scripts)

## Known broken
- Nothing yet

## Do not touch without ADR
- Transit detection algorithm (ARCHITECTURE.md Section 6)
- API response contracts (ARCHITECTURE.md Section 8)
