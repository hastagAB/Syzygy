# State

## Now
Phase 1 (Foundation - Core Engine), not yet started. Next: S001 project scaffolding.
E2E target: Given a known past ISS transit (date + location), the engine predicts it.

## Last working state
No commits yet. Greenfield project.

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
