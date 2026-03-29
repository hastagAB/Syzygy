# Syzygy - Satellite Transit Finder

> *Syzygy (n.): the alignment of three celestial bodies in a straight line - precisely what happens during a satellite transit.*

Syzygy predicts when satellites (ISS, Hubble, Tiangong, etc.) will transit across the Sun or Moon as seen from your location. Enter where you are, how far you'll travel, and when you're available - Syzygy tells you exactly where to stand and when to look up.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Core Concepts](#2-core-concepts)
3. [User Flows](#3-user-flows)
4. [System Architecture](#4-system-architecture)
5. [Data Pipeline](#5-data-pipeline)
6. [Transit Detection Algorithm](#6-transit-detection-algorithm)
7. [Tech Stack](#7-tech-stack)
8. [API Design](#8-api-design)
9. [Frontend Design](#9-frontend-design)
10. [Data Sources](#10-data-sources)
11. [Performance Strategy](#11-performance-strategy)
12. [Project Structure](#12-project-structure)
13. [Build Phases](#13-build-phases)

---

## 1. Problem Statement

A satellite transit across the Sun or Moon is one of the rarest astrophotography events. The ISS crosses the sky in under 6 minutes, but the actual transit across the solar/lunar disk lasts **less than 1 second**. The visible ground track is only a few kilometers wide. Without precise prediction tools:

- You won't know **when** it happens
- You won't know **where to stand** (a few km off and you miss it entirely)
- You won't know if it's even **possible** from your area in a given time window

**Syzygy solves this** by computing all upcoming transit opportunities for a given location, time window, and travel radius - then presenting them on an interactive map with exact timing.

### Requirements

| Requirement | Description |
|---|---|
| **Auto-detect location** | Use browser Geolocation API; fall back to IP-based geolocation |
| **Manual location input** | Search box with geocoding + click-on-map |
| **Time window: 1-3 months** | User selects a date range up to 90 days |
| **Travel radius** | Configurable: 10 km to 500 km |
| **Multiple satellites** | ISS, Hubble, Tiangong, CSS, and user-selectable others |
| **No-event feedback** | If no transits found: suggest increasing radius or extending time window |
| **Transit details** | Exact time, location, duration, angular diameter, Sun/Moon altitude, ground track on map |

---

## 2. Core Concepts

### What Is a Satellite Transit?

A transit occurs when a satellite passes directly between an observer and either the Sun or Moon. The satellite appears as a **dark silhouette** against the bright disk.

```
    Observer (You)
        |
        |  line of sight
        v
    [Satellite] -----> silhouette visible
        |
        v
    [Sun or Moon]
```

### Why Is It So Hard to See?

| Factor | Value |
|---|---|
| ISS orbital velocity | 7.66 km/s (17,500 mph) |
| Transit duration | 0.3 - 1.5 seconds |
| Ground track width | 5 - 10 km |
| ISS angular diameter | ~40-60 arcseconds (similar to Jupiter) |
| Sun/Moon angular diameter | ~1,800 arcseconds (0.5 degrees) |

### Key Astronomical Terms

- **TLE (Two-Line Element set)**: Compact format encoding a satellite's orbital parameters. Published by NORAD/CelesTrak. Used with SGP4 to propagate orbits.
- **SGP4**: Simplified General Perturbations model #4. The standard algorithm for propagating TLE data to compute satellite positions at any future time.
- **Topocentric coordinates**: Position of an object as seen from a specific point on Earth's surface (not Earth's center).
- **Angular separation**: The angle between two objects as seen from the observer. A transit occurs when this is smaller than the target body's angular radius.
- **Ephemeris**: A table of computed positions of a celestial body at regular time intervals.

---

## 3. User Flows

### Flow 1: Quick Search (Auto-Location)

```
User opens Syzygy
    |
    v
Browser requests geolocation permission
    |
    +-- Granted --> auto-fill lat/lon
    +-- Denied  --> show manual input / IP fallback
    |
    v
User sets: date range (default: next 30 days), travel radius (default: 100 km)
    |
    v
User selects satellites (default: ISS checked, others optional)
    |
    v
[Compute] button pressed
    |
    v
Loading state with progress indicator
    |
    v
Results displayed:
    +-- Transit events found --> list + map with ground tracks
    +-- No events found     --> "No transits within 100 km in next 30 days.
                                 Try: increase radius to 200 km or extend to 60 days."
```

### Flow 2: Manual Location

```
User types city/address into search bar
    |
    v
Geocoding API returns suggestions (debounced, 300ms)
    |
    v
User selects a suggestion (or clicks directly on map)
    |
    v
Map centers on location, proceeds to search parameters
```

### Flow 3: Event Detail View

```
User clicks a transit event from results list
    |
    v
Detail panel shows:
    - Satellite name + NORAD ID
    - Transit type (Solar / Lunar)
    - Date + exact time (UTC + local)
    - Transit duration (ms)
    - Satellite angular diameter (arcseconds)
    - Sun/Moon altitude above horizon (degrees)
    - Sun/Moon azimuth
    - Distance from user's location to optimal point
    - Weather outlook (optional, future feature)
    |
    v
Map shows:
    - Ground track centerline (colored polyline)
    - Visibility corridor (semi-transparent polygon)
    - Optimal observation point (marker)
    - User's location (marker)
    - Driving directions link (Google Maps / Apple Maps)
```

---

## 4. System Architecture

### High-Level Overview

```
+--------------------------------------------------+
|                   FRONTEND                        |
|  Next.js (React) + TypeScript                     |
|  - Map (Leaflet + OpenStreetMap)                  |
|  - Location input (Geolocation API + Nominatim)   |
|  - Parameter controls (date range, radius, sats)  |
|  - Results list + detail panels                   |
+--------------------------------------------------+
                      |
                      | REST API calls
                      v
+--------------------------------------------------+
|                   BACKEND                         |
|  Next.js API Routes (Node.js)                     |
|                                                   |
|  +--------------------------------------------+  |
|  |          Transit Computation Engine         |  |
|  |  - TLE fetcher (CelesTrak)                 |  |
|  |  - SGP4 propagator (satellite.js)          |  |
|  |  - Sun/Moon ephemeris (astronomia)          |  |
|  |  - Transit detector (geometry engine)       |  |
|  |  - Ground track calculator                  |  |
|  +--------------------------------------------+  |
|                                                   |
|  +--------------------------------------------+  |
|  |             TLE Cache Layer                 |  |
|  |  - In-memory cache (refreshed every 2 hrs) |  |
|  |  - SQLite fallback for persistence          |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
                      |
                      | HTTPS
                      v
+--------------------------------------------------+
|              EXTERNAL DATA SOURCES                |
|  - CelesTrak (TLE data)                          |
|  - Nominatim (geocoding)                          |
|  - Browser Geolocation API (client-side)          |
+--------------------------------------------------+
```

### Why This Architecture?

| Decision | Rationale |
|---|---|
| **Next.js monorepo** | Frontend + API in one deployment. No separate backend server. Simple to deploy on Vercel/Netlify. |
| **Server-side computation** | SGP4 propagation over 90 days is CPU-intensive. Keep it server-side to avoid blocking the browser UI thread. |
| **TLE cache** | CelesTrak rate-limits requests. Cache TLEs in-memory with a 2-hour TTL. |
| **No database (initial)** | No user accounts. No persistent state beyond TLE cache. SQLite only if we add saved searches later. |
| **Leaflet over Google Maps** | Free, no API key required, open-source, excellent tile providers. |

---

## 5. Data Pipeline

### TLE Acquisition

```
CelesTrak (HTTPS GET)
    |
    v
Raw TLE text (3-line format: name + line1 + line2)
    |
    v
Parse into structured objects:
    {
      name: "ISS (ZARYA)",
      noradId: 25544,
      line1: "1 25544U 98067A ...",
      line2: "2 25544 ..."
    }
    |
    v
Store in memory cache (Map<noradId, TLERecord>)
    |
    v
TTL: 2 hours (ISS TLEs updated ~daily, but we want freshness)
```

### Supported Satellites

| Satellite | NORAD ID | Size (m) | Typical Angular Diameter |
|---|---|---|---|
| ISS (ZARYA) | 25544 | 109 x 73 | 40-60 arcsec |
| Hubble (HST) | 20580 | 13.2 x 4.2 | 3-5 arcsec |
| Tiangong (CSS) | 54216 | 55 x 20 | 15-25 arcsec |
| GOES-16 | 41866 | GEO orbit | Too far / tiny |

The ISS is by far the easiest target due to its size and low orbit. Users can select others, but the UI should default to ISS and note difficulty ratings.

### Sun/Moon Position Computation

No external API needed. Computed algorithmically:

- **Sun position**: Jean Meeus algorithms (Solar Coordinates, Chapter 25 of "Astronomical Algorithms")
- **Moon position**: Meeus lunar position (Chapter 47), with corrections for parallax (critical - the Moon is close enough that topocentric vs geocentric matters)

Both computed in the `astronomia` library or equivalent.

---

## 6. Transit Detection Algorithm

This is the computational core of Syzygy. The algorithm runs server-side.

### Phase 1: Coarse Scan

Reduce the search space before doing expensive per-second calculations.

```
For each satellite:
    For each day in date range:
        For each 10-second interval in the day:
            1. Propagate satellite position via SGP4 -> ECI coords
            2. Convert to geodetic (lat, lon, alt)
            3. Check: is the satellite above the horizon from observer?
               (elevation > 0 degrees)
            4. Check: is the Sun or Moon above the horizon?
               (for solar transit: Sun altitude > 5 degrees)
               (for lunar transit: Moon altitude > 5 degrees)
            5. Compute angular separation between satellite and Sun/Moon
               (topocentric, accounting for parallax)
            6. If angular separation < 2 degrees: mark as CANDIDATE WINDOW
```

### Phase 2: Fine Scan

For each candidate window, refine to sub-second precision.

```
For each candidate window (typically 20-60 seconds wide):
    For each 0.1-second step within the window:
        1. Propagate satellite position (SGP4)
        2. Compute Sun/Moon topocentric position
        3. Compute angular separation
        4. If separation < (Sun/Moon angular radius):
            --> TRANSIT DETECTED at this time from this location
        5. Record: entry time, exit time, minimum separation, centerline point
```

### Phase 3: Ground Track Sweep

The observer might not be at the transit centerline. Sweep nearby points.

```
For each confirmed transit time:
    Create a grid of points within the user's travel radius:
        - Grid spacing: ~2 km (adjustable based on radius)
        - For a 100 km radius: ~7,850 grid points
    
    For each grid point:
        1. Recompute satellite topocentric position from this point
        2. Recompute Sun/Moon topocentric position from this point
        3. Compute angular separation
        4. Record minimum separation for this point
    
    Contour the results:
        - Centerline: points with minimum separation
        - Transit corridor: all points where separation < target angular radius
        - Map as a polyline (centerline) + polygon (corridor)
```

### Angular Separation Formula

```
cos(d) = sin(alt1) * sin(alt2) + cos(alt1) * cos(alt2) * cos(az1 - az2)

Where:
    d    = angular separation
    alt1 = altitude of object 1 (satellite)
    alt2 = altitude of object 2 (Sun/Moon)
    az1  = azimuth of object 1
    az2  = azimuth of object 2
```

### Satellite Angular Diameter

```
angular_diameter = 2 * arctan(physical_size / (2 * distance))

Where:
    physical_size = satellite's largest dimension (e.g., 109m for ISS)
    distance      = slant range from observer to satellite (km)
```

---

## 7. Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14+** (App Router) | React framework, SSR, API routes |
| **TypeScript** | Type safety throughout |
| **Leaflet** + **react-leaflet** | Interactive map with OpenStreetMap tiles |
| **Tailwind CSS** | Utility-first styling |
| **date-fns** | Date manipulation and formatting |
| **Zustand** | Lightweight state management |

### Backend (Next.js API Routes)

| Technology | Purpose |
|---|---|
| **satellite.js** | SGP4/SDP4 orbital propagation from TLEs |
| **astronomia** | Sun/Moon ephemeris calculations |
| **node-cache** | In-memory TLE caching with TTL |

### DevOps

| Technology | Purpose |
|---|---|
| **Vercel** | Deployment (serverless, edge-optimized) |
| **pnpm** | Package manager |
| **ESLint + Prettier** | Code quality |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing (optional, later phase) |

---

## 8. API Design

All endpoints are Next.js API routes under `/api/v1/`.

### `POST /api/v1/transits/search`

The primary endpoint. Computes transit opportunities.

**Request:**
```json
{
  "location": {
    "lat": 45.4642,
    "lon": 9.1900
  },
  "dateRange": {
    "start": "2026-05-01",
    "end": "2026-06-30"
  },
  "radiusKm": 100,
  "satellites": ["ISS", "HST"],
  "targets": ["sun", "moon"]
}
```

**Response (200):**
```json
{
  "meta": {
    "location": { "lat": 45.4642, "lon": 9.1900 },
    "dateRange": { "start": "2026-05-01", "end": "2026-06-30" },
    "radiusKm": 100,
    "computeTimeMs": 4823,
    "tleEpoch": "2026-04-28T06:00:00Z"
  },
  "transits": [
    {
      "id": "iss-sun-20260517-143022",
      "satellite": {
        "name": "ISS (ZARYA)",
        "noradId": 25544,
        "angularDiameterArcsec": 52.3
      },
      "target": "sun",
      "time": {
        "utc": "2026-05-17T14:30:22.450Z",
        "durationMs": 870
      },
      "observationPoint": {
        "lat": 45.5012,
        "lon": 9.2340,
        "distanceFromUserKm": 5.2
      },
      "targetBody": {
        "altitudeDeg": 58.3,
        "azimuthDeg": 195.7,
        "angularDiameterArcsec": 1891
      },
      "groundTrack": {
        "centerline": [
          [45.48, 9.10],
          [45.50, 9.23],
          [45.52, 9.36]
        ],
        "corridorWidthKm": 7.2
      },
      "quality": {
        "score": 0.85,
        "notes": "High altitude, near-center crossing"
      }
    }
  ],
  "suggestions": null
}
```

**Response (200, no results):**
```json
{
  "meta": { "..." : "..." },
  "transits": [],
  "suggestions": {
    "increaseRadius": {
      "suggestedKm": 200,
      "reason": "Nearest transit found at 187 km from your location"
    },
    "extendDateRange": {
      "suggestedEnd": "2026-08-31",
      "reason": "Next transit within 100 km occurs on 2026-08-12"
    }
  }
}
```

**Error (422):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Date range cannot exceed 90 days",
    "details": [
      { "field": "dateRange.end", "issue": "Range is 120 days, max is 90" }
    ]
  }
}
```

### `GET /api/v1/satellites`

Returns list of supported satellites with metadata.

**Response (200):**
```json
{
  "satellites": [
    {
      "id": "ISS",
      "name": "ISS (ZARYA)",
      "noradId": 25544,
      "sizeMeters": 109,
      "difficulty": "easy",
      "description": "Largest angular diameter of any satellite"
    },
    {
      "id": "HST",
      "name": "Hubble Space Telescope",
      "noradId": 20580,
      "sizeMeters": 13.2,
      "difficulty": "hard",
      "description": "Much smaller silhouette, requires longer focal length"
    }
  ]
}
```

### `GET /api/v1/geocode?q={query}`

Proxied geocoding to avoid exposing Nominatim directly from the client.

**Response (200):**
```json
{
  "results": [
    {
      "displayName": "Milan, Lombardy, Italy",
      "lat": 45.4642,
      "lon": 9.1900
    }
  ]
}
```

---

## 9. Frontend Design

### Layout

```
+---------------------------------------------------------------+
|  [Syzygy Logo]                              [About] [GitHub]  |
+---------------------------------------------------------------+
|                                                                |
|  +--SEARCH PANEL (left, 380px)--+  +------MAP (right)------+  |
|  |                              |  |                        |  |
|  |  Location:                   |  |                        |  |
|  |  [____Milan, Italy____] [x]  |  |     Leaflet Map        |  |
|  |  [Use my location]           |  |     with OSM tiles     |  |
|  |                              |  |                        |  |
|  |  Date Range:                 |  |     - User marker      |  |
|  |  [May 1] to [Jun 30, 2026]  |  |     - Travel radius    |  |
|  |                              |  |       circle            |  |
|  |  Travel Radius:              |  |     - Ground tracks    |  |
|  |  [====o========] 100 km      |  |       (when results)   |  |
|  |                              |  |     - Observation       |  |
|  |  Satellites:                 |  |       point markers    |  |
|  |  [x] ISS (easy)             |  |                        |  |
|  |  [ ] Hubble (hard)          |  |                        |  |
|  |  [ ] Tiangong (medium)      |  |                        |  |
|  |                              |  |                        |  |
|  |  Transit Across:             |  |                        |  |
|  |  [x] Sun  [x] Moon          |  |                        |  |
|  |                              |  |                        |  |
|  |  [    Find Transits    ]     |  |                        |  |
|  |                              |  |                        |  |
|  +------------------------------+  +------------------------+  |
|                                                                |
|  +--RESULTS PANEL (bottom, collapsible)------------------------+
|  |                                                              |
|  |  3 transits found in May 1 - Jun 30, 2026                  |
|  |                                                              |
|  |  +-- Event Card ------------------------------------------+ |
|  |  | ISS Solar Transit - May 17, 2026 at 16:30:22 local    | |
|  |  | Duration: 870ms | Distance: 5.2 km | Quality: Great   | |
|  |  | Sun altitude: 58.3 deg | [View on Map] [Directions]   | |
|  |  +--------------------------------------------------------+ |
|  |                                                              |
|  |  +-- Event Card ------------------------------------------+ |
|  |  | ISS Lunar Transit - Jun 3, 2026 at 21:15:44 local     | |
|  |  | Duration: 1120ms | Distance: 42 km | Quality: Good    | |
|  |  | Moon altitude: 35.1 deg | [View on Map] [Directions]  | |
|  |  +--------------------------------------------------------+ |
|  +--------------------------------------------------------------+
```

### Mobile Layout

On screens < 768px:
- Map goes full-width at top (40vh)
- Search panel below map (collapsible)
- Results panel at bottom (scrollable cards)

### Key UI Components

| Component | Responsibility |
|---|---|
| `LocationInput` | Search box + Geolocation button + map click handler |
| `DateRangePicker` | Two date inputs with validation (max 90 days) |
| `RadiusSlider` | Range input 10-500 km, shows circle on map |
| `SatelliteSelector` | Checkbox list with difficulty badges |
| `TransitMap` | Leaflet map with markers, ground tracks, radius circle |
| `ResultsList` | Sorted transit event cards |
| `EventDetail` | Expanded view with all transit parameters |
| `NoResultsBanner` | Shows suggestions when no transits found |

---

## 10. Data Sources

### CelesTrak - TLE Data

- **URL**: `https://celestrak.org/NORAD/elements/gp.php?CATNR={noradId}&FORMAT=TLE`
- **Rate limit**: Be respectful; cache aggressively
- **Update frequency**: TLEs updated 1-4 times daily
- **Accuracy**: Good for 1-2 weeks; degrades beyond that. For 90-day windows, warn users about decreasing accuracy for later dates.

### Nominatim - Geocoding

- **URL**: `https://nominatim.openstreetmap.org/search?q={query}&format=json`
- **Rate limit**: 1 request/second (enforce server-side)
- **Usage policy**: Must include a User-Agent identifying the app

### Browser Geolocation API

- **API**: `navigator.geolocation.getCurrentPosition()`
- **Accuracy**: GPS on mobile (5-10m), Wi-Fi on desktop (50-200m)
- **Fallback**: IP-based geolocation via a free service (lower accuracy, ~city level)

---

## 11. Performance Strategy

### The Computational Challenge

For a 90-day search with 1 satellite, 10-second coarse scan:

```
90 days x 86,400 sec/day / 10 sec = 777,600 coarse evaluations
```

Each evaluation involves: SGP4 propagation + Sun/Moon position + angular separation.

For the ground track sweep of a candidate, with 100 km radius at 2 km grid:

```
pi * (100/2)^2 grid points = ~7,850 points per candidate transit
```

### Optimization Strategy

| Technique | Impact |
|---|---|
| **Coarse-to-fine scanning** | 10s intervals first, then 0.1s only near candidates. Reduces evaluations by ~100x. |
| **Early exit checks** | Skip nighttime for solar transits. Skip daytime for lunar transits (partially). Skip when satellite is below horizon. |
| **Pre-compute Sun/Moon track** | Sun/Moon move slowly. Compute their positions at 1-minute intervals and interpolate. Saves ~90% of ephemeris calculations. |
| **Web Workers (if client-side)** | Offload computation to background threads. But prefer server-side. |
| **Streaming results** | Use Server-Sent Events to push results as they're found, instead of waiting for full computation. |
| **Caching** | Cache TLEs (2hr TTL). Cache Sun/Moon ephemeris for the day. |

### Estimated Computation Time

| Scenario | Estimated Time |
|---|---|
| ISS only, 30 days, 100 km radius | ~2-5 seconds |
| ISS only, 90 days, 100 km radius | ~5-12 seconds |
| 3 satellites, 90 days, 300 km radius | ~15-30 seconds |

These are estimates - will benchmark and optimize during implementation.

---

## 12. Project Structure

```
syzygy/
  src/
    app/                          # Next.js App Router
      layout.tsx                  # Root layout with metadata
      page.tsx                    # Main page (search + map + results)
      globals.css                 # Tailwind base + custom styles
      api/
        v1/
          transits/
            search/
              route.ts            # POST - transit search endpoint
          satellites/
            route.ts              # GET - satellite list
          geocode/
            route.ts              # GET - proxied geocoding

    components/
      map/
        TransitMap.tsx            # Leaflet map wrapper
        GroundTrack.tsx           # Polyline + corridor overlay
        LocationMarker.tsx        # User + observation point markers
        RadiusCircle.tsx          # Travel radius visualization
      search/
        SearchPanel.tsx           # Main search form container
        LocationInput.tsx         # Geocoding search + geolocation button
        DateRangePicker.tsx       # Date range selector
        RadiusSlider.tsx          # Travel radius slider
        SatelliteSelector.tsx     # Satellite checkbox list
      results/
        ResultsList.tsx           # Transit event cards
        EventCard.tsx             # Single event summary
        EventDetail.tsx           # Expanded event view
        NoResultsBanner.tsx       # Suggestions when empty
      layout/
        Header.tsx                # App header
        Footer.tsx                # App footer

    lib/
      engine/
        sgp4.ts                   # SGP4 propagation wrapper
        ephemeris.ts              # Sun/Moon position calculations
        transit-detector.ts       # Core transit detection algorithm
        ground-track.ts           # Ground track + corridor computation
        geometry.ts               # Angular separation, coordinate transforms
      data/
        tle-fetcher.ts            # CelesTrak TLE fetching + parsing
        tle-cache.ts              # In-memory cache with TTL
        satellites.ts             # Satellite catalog (IDs, sizes, metadata)
      geo/
        geocoder.ts               # Nominatim geocoding wrapper
        geolocation.ts            # Browser geolocation helper
        coordinates.ts            # Lat/lon utilities, distance calculations

    types/
      transit.ts                  # Transit, SearchParams, SearchResult types
      satellite.ts                # Satellite, TLE types
      geo.ts                      # Location, BoundingBox types

    hooks/
      useGeolocation.ts           # Browser geolocation hook
      useTransitSearch.ts         # Search state + API call hook
      useMap.ts                   # Map interaction state

    store/
      search-store.ts             # Zustand store for search state

  tests/
    unit/
      engine/
        transit-detector.test.ts
        geometry.test.ts
        ephemeris.test.ts
      data/
        tle-fetcher.test.ts
    integration/
      api/
        transits-search.test.ts

  public/
    satellites/                   # Satellite silhouette SVGs (for detail view)

  package.json
  tsconfig.json
  tailwind.config.ts
  next.config.ts
  vitest.config.ts
  .env.example                   # NOMINATIM_USER_AGENT, etc.
  README.md
```

---

## 13. Build Phases

### Phase 1: Foundation (Core Engine)
**Goal**: Compute a transit from hardcoded coordinates and verify against known data.

- [ ] Project setup: Next.js + TypeScript + Tailwind + ESLint
- [ ] TLE fetcher: fetch + parse TLEs from CelesTrak
- [ ] SGP4 wrapper: propagate satellite positions using `satellite.js`
- [ ] Sun/Moon ephemeris: compute positions using `astronomia`
- [ ] Geometry module: angular separation, topocentric transforms
- [ ] Transit detector: coarse scan + fine scan for a single point
- [ ] Unit tests: validate against known ISS transit events

**Verify**: Given a known past ISS transit (date, location), the engine predicts it correctly.

### Phase 2: API Layer
**Goal**: Expose transit search as a REST endpoint.

- [ ] `POST /api/v1/transits/search` - full search with validation
- [ ] `GET /api/v1/satellites` - satellite catalog
- [ ] `GET /api/v1/geocode` - geocoding proxy
- [ ] TLE cache: in-memory with 2-hour TTL
- [ ] Input validation: date range limits, radius bounds, coordinate bounds
- [ ] Error responses: consistent error shape
- [ ] Integration tests: API contract tests

**Verify**: API returns correct transit data for known test cases.

### Phase 3: Map + Location
**Goal**: Interactive map with location input and radius visualization.

- [ ] Leaflet map component with OpenStreetMap tiles
- [ ] Geolocation hook (browser API + fallback)
- [ ] Location search with Nominatim geocoding (debounced)
- [ ] Click-on-map to set location
- [ ] Travel radius circle overlay
- [ ] Responsive layout (desktop sidebar + mobile stack)

**Verify**: User can set location via search, geolocation, or map click. Radius circle renders.

### Phase 4: Search + Results
**Goal**: End-to-end search flow with results display.

- [ ] Search panel: wire all controls to API
- [ ] Loading state with progress indication
- [ ] Results list with event cards
- [ ] No-results banner with suggestions
- [ ] Ground track rendering on map (centerline + corridor)
- [ ] Observation point markers
- [ ] Event detail panel

**Verify**: User can search and see transit events on map and in list.

### Phase 5: Polish + Optimization
**Goal**: Production-ready quality.

- [ ] Streaming results via SSE (optional, if computation is slow)
- [ ] Sun/Moon ephemeris caching/interpolation
- [ ] Accuracy disclaimer for dates > 14 days out
- [ ] Timezone-aware time display
- [ ] Driving directions links (Google Maps / Apple Maps)
- [ ] Quality score calculation
- [ ] Mobile responsiveness pass
- [ ] SEO metadata
- [ ] Deploy to Vercel

**Verify**: Full user flow works on desktop and mobile. Performance targets met.

### Phase 6: Enhancements (Post-MVP)
- [ ] Weather overlay (cloud cover predictions for transit date)
- [ ] Notification system (email alerts for upcoming transits)
- [ ] Share transit events (URL with encoded parameters)
- [ ] Historical transit gallery (community-submitted photos)
- [ ] Satellite 3D model in detail view
- [ ] PWA support for offline access to saved events

---

## Appendix: Reference Data

### Known ISS Transits for Validation

During development, use these confirmed past transits to validate the engine:

| Date | Type | Location | Duration |
|---|---|---|---|
| (To be populated with verified transit data from transit-finder.com archives) |

### Useful Formulas

**Great-circle distance (Haversine):**
```
a = sin^2(dlat/2) + cos(lat1) * cos(lat2) * sin^2(dlon/2)
c = 2 * atan2(sqrt(a), sqrt(1-a))
d = R * c    (R = 6371 km)
```

**ECI to Geodetic conversion:**
Standard GMST-based rotation from Earth-Centered Inertial to ECEF, then to geodetic (lat, lon, alt).

**Topocentric from Geodetic:**
Transform from geocentric to observer-centered coordinates accounting for Earth's oblateness and the observer's position.
