# Backlog

Ordered by dependency. Execute top-to-bottom within each phase.

---

## Phase 1: Foundation (Core Engine) - COMPLETE

- [x] **S001** - Project scaffolding `[P0]`
- [x] **S002** - Type definitions `[P0] [needs: S001]`
- [x] **S003** - TLE fetcher + parser `[P0] [needs: S002]`
- [x] **S004** - SGP4 propagation wrapper `[P0] [needs: S002]`
- [x] **S005** - Sun/Moon ephemeris `[P0] [needs: S002]`
- [x] **S006** - Geometry module (coordinates + angular separation) `[P0] [needs: S002]`
- [x] **S007** - Transit detector (coarse scan) `[P0] [needs: S003, S004, S005, S006]`
- [x] **S008** - Transit detector (fine scan) `[P0] [needs: S007]`
- [x] **S009** - Ground track calculator `[P1] [needs: S008]`
- [x] **S010** - Phase 1 e2e: validate against known ISS transit `[P0] [needs: S007, S008]`

## Phase 2: API Layer - COMPLETE

- [x] **S011** - TLE cache with TTL `[P0] [needs: S003]`
- [x] **S012** - Satellite catalog (static data + endpoint) `[P0] [needs: S002]`
- [x] **S013** - Transit search endpoint (POST /api/v1/transits/search) `[P0] [needs: S010, S011, S012]`
- [x] **S014** - Geocode proxy endpoint `[P1] [needs: S001]`
- [x] **S015** - Input validation + error responses `[P0] [needs: S013]` (Zod validation in S013 route)
- [ ] **S016** - Phase 2 e2e: API contract test with known transit `[P0] [needs: S013, S015]`

## Phase 3: Map + Location - COMPLETE

- [x] **S017** - Leaflet map component (base map + tiles) `[P0] [needs: S001]`
- [x] **S018** - Geolocation hook (browser API + fallback) `[P0] [needs: S001]`
- [x] **S019** - Location search input with geocoding `[P0] [needs: S014, S017]`
- [x] **S020** - Radius circle overlay + slider `[P1] [needs: S017]`
- [x] **S021** - Responsive layout (sidebar + mobile) `[P1] [needs: S017]`
- [ ] **S022** - Phase 3 e2e: set location 3 ways, see radius on map `[P0] [needs: S019, S020]`

## Phase 4: Search + Results - COMPLETE

- [x] **S023** - Search panel (wire controls to store) `[P0] [needs: S022]`
- [x] **S024** - Search execution (call API, manage loading state) `[P0] [needs: S023, S016]`
- [x] **S025** - Results list + event cards `[P0] [needs: S024]`
- [x] **S026** - No-results banner with suggestions `[P1] [needs: S025]`
- [x] **S027** - Ground track rendering on map `[P1] [needs: S025, S009]`
- [x] **S028** - Event detail panel `[P1] [needs: S025]` (inline in TransitCard)
- [ ] **S029** - Phase 4 e2e: full search flow from input to results `[P0] [needs: S025]`

## Phase 5: Polish + Deploy

- [ ] **S030** - Ephemeris caching/interpolation `[P1] [needs: S005]`
- [x] **S031** - Timezone-aware time display `[P1] [needs: S025]` (toLocaleString with timeZoneName)
- [ ] **S032** - Quality score + accuracy disclaimer `[P2] [needs: S025]`
- [ ] **S033** - Driving directions links `[P2] [needs: S028]`
- [ ] **S034** - Mobile responsiveness pass `[P1] [needs: S029]`
- [ ] **S035** - SEO metadata + deploy to Vercel `[P1] [needs: S029]`

---

## Legend
- `[P0]` - Must have (blocks downstream)
- `[P1]` - Should have (improves UX/quality)
- `[P2]` - Nice to have (polish)
- `[needs: SXXX]` - Cannot start until SXXX is complete
- `[x]` - Done, `[ ]` - Not started
