# State

## Now
Phase 2 (API Layer). Next: S011 search endpoint.
Phase 1 complete: 67 tests, 10 slices (S001-S010), core engine validated e2e.

## Last working state
Commit ac096bb - Phase 1 e2e gate green. All engine modules operational:
- TLE fetcher (S003), SGP4 wrapper (S004), Ephemeris (S005), Geometry (S006)
- Transit detector: coarse scan (S007) + fine scan (S008)
- Ground track calculator (S009)
- Pipeline: coarseScan -> fineScan -> computeGroundTrack

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
