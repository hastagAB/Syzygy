# ADR-001: Next.js Monorepo Architecture

**Date:** 2026-04-28
**Status:** Accepted

## Context
Syzygy needs a web frontend (map, search, results) and a computation backend (SGP4, ephemeris, transit detection). We need to decide how to structure the deployment.

## Decision
Use a Next.js monorepo with App Router. Frontend pages and API routes live in the same project. Deploy as a single unit to Vercel.

## Rationale
- Single deployment simplifies ops for a hobby/side project
- Next.js API routes handle the server-side computation (no separate backend)
- Vercel serverless functions have a 60-second timeout (sufficient for our 5-30s computation times)
- No need for a database initially - in-memory TLE cache is sufficient
- If computation becomes too heavy for serverless, we can extract the engine later

## Consequences
- Serverless cold starts may add 1-2 seconds to first request
- 60-second Vercel timeout limits maximum computation time
- Cannot run persistent background TLE refresh (must refresh on-demand with TTL cache)

---

# ADR-002: Server-Side Computation

**Date:** 2026-04-28
**Status:** Accepted

## Context
SGP4 propagation over 90 days requires millions of evaluations. Should this run in the browser or on the server?

## Decision
All transit computation runs server-side in Next.js API routes. The browser only handles UI rendering and API calls.

## Rationale
- 90-day scans are CPU-intensive (5-30 seconds). Browser main thread would freeze the UI.
- Web Workers could help but add complexity and still compete with UI thread on mobile.
- Server-side allows caching TLEs across requests (in-memory cache benefits all users).
- Keeps `satellite.js` and `astronomia` out of the client bundle (smaller bundle size).

## Consequences
- Requires network round-trip for every search
- No offline capability (by design - TLEs need to be fresh anyway)
- Server-side computation cost scales with users (but acceptable for hobby project)
