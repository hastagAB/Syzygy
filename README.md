<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Tests-109%20passing-brightgreen?style=flat-square" alt="109 Tests Passing" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

# Syzygy

**Satellite Transit Finder** - Predict exactly when and where the ISS, Hubble, or Tiangong will cross the Sun or Moon from your location.

> *Syzygy (n.): the alignment of three celestial bodies in a straight line - precisely what happens during a satellite transit.*

A satellite transit across the Sun or Moon lasts **less than 1 second** and is visible from a ground strip only **4-10 km wide**. Without precise prediction, you will miss it. Syzygy computes every upcoming transit opportunity for your location, travel radius, and time window - then shows you exactly where to stand and when to look up.

---

## Why This Exists

Satellite solar/lunar transits are among the rarest events in amateur astronomy:

| Factor | Value |
|---|---|
| ISS orbital velocity | 7.66 km/s (27,600 km/h) |
| Transit duration | 0.3 - 1.5 seconds |
| Visible ground track width | 4 - 10 km |
| ISS angular size | ~40-60 arcseconds (similar to Jupiter) |
| Sun/Moon angular size | ~1,800 arcseconds (0.5 degrees) |

Miss your mark by 5 km and you see nothing. Syzygy eliminates the guesswork.

---

## Features

- **Multi-satellite support** - ISS, Hubble Space Telescope, Tiangong (Chinese Space Station)
- **Solar and lunar transits** - Search for transits across the Sun, Moon, or both
- **Travel radius** - Set how far you are willing to drive (10-500 km)
- **Observation point** - Exact GPS coordinates of where to set up your telescope
- **Google Maps navigation** - One-click directions to the observation point
- **Transit timeline** - Entry time, exit time, and total crossing duration
- **Quality scoring** - Each transit rated 0-100 based on duration, altitude, and angular separation
- **Ground track visualization** - See the transit path on an interactive satellite imagery map
- **Copy and share** - Copy transit details to clipboard for sharing with fellow astronomers
- **Filtering and sorting** - Filter by solar/lunar, sort by quality, date, distance, or duration

---

## How It Works

```
You (Observer)
     |
     |  line of sight
     v
 [Satellite] ----> dark silhouette visible against bright disk
     |
     v
 [Sun or Moon]
```

### Detection Pipeline

1. **TLE Fetch** - Download fresh orbital elements from CelesTrak (cached 2 hours)
2. **Coarse Scan** - Propagate satellite orbit via SGP4 at 60-second intervals, identify passes above the horizon
3. **Candidate Detection** - During each pass, check angular separation to Sun/Moon at 10-second intervals from 17 sample points around the observer
4. **Fine Scan** - Refine candidates at 0.1-second precision to find exact entry/exit times
5. **Ground Track** - Compute the visibility corridor and optimal observation point
6. **Quality Scoring** - Rate each transit based on duration, target altitude, and minimum angular separation

### The Math

- **Orbital propagation**: SGP4/SDP4 (NORAD standard) via `satellite.js`
- **Sun/Moon positions**: Meeus algorithms via `astronomia` (topocentric, parallax-corrected)
- **Angular separation**: Spherical trigonometry on altitude/azimuth coordinates
- **Sidereal time**: Properly converted from `astronomia`'s seconds to radians

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

### Install and Run

```bash
# Clone the repository
git clone https://github.com/your-username/syzygy.git
cd syzygy

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start finding transits.

### Environment Variables (Optional)

Copy `.env.example` to `.env.local` to customize:

```bash
cp .env.example .env.local
```

All variables have sensible defaults. No API keys required.

---

## Project Structure

```
src/
  app/                          # Next.js App Router
    api/v1/
      geocode/route.ts          # Location search proxy (Nominatim)
      transits/search/route.ts  # Transit search endpoint
    globals.css                 # Tailwind + custom styles
    layout.tsx                  # Root layout (Inter font, metadata)
    page.tsx                    # Main app (sidebar + map)
  components/
    map/
      TransitMap.tsx            # Leaflet map with ESRI satellite tiles
      index.tsx                 # Dynamic import (SSR disabled)
    results/
      ResultsList.tsx           # Transit cards with filters and sorting
    search/
      SearchPanel.tsx           # Location, date, radius, satellite controls
  lib/
    config.ts                   # All configurable constants
    data/
      geocoder.ts               # Nominatim geocoding client
      satellite-catalog.ts      # Supported satellites registry
      tle-cache.ts              # In-memory TLE cache with TTL
      tle-fetcher.ts            # CelesTrak TLE downloader
    engine/
      ephemeris.ts              # Sun/Moon position (topocentric)
      geometry.ts               # Angular separation, coordinate transforms
      ground-track.ts           # Visibility corridor computation
      search-orchestrator.ts    # Full search pipeline orchestration
      sgp4.ts                   # SGP4 propagation wrapper
      transit-detector.ts       # Two-phase coarse + fine scan
    store/
      search-store.ts           # Zustand state management
  types/
    astronomia.d.ts             # Type declarations for astronomia
    geo.ts                      # Geographic coordinate types
    index.ts                    # Barrel exports
    satellite.ts                # Satellite data types
    transit.ts                  # Transit event types
tests/
  e2e/                          # End-to-end engine validation
  fixtures/                     # Test data (TLEs, known transits)
  unit/                         # Unit tests (109 tests, 16 files)
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm typecheck` | TypeScript strict type checking |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier (auto-fix) |
| `pnpm format:check` | Prettier (check only) |
| `pnpm check` | Run all checks (typecheck + lint + format + test) |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack React with API routes |
| Language | TypeScript 6 (strict) | Type safety across the stack |
| Styling | Tailwind CSS 4 | Utility-first dark theme |
| Map | Leaflet + ESRI World Imagery | Interactive satellite map with no API key |
| State | Zustand | Lightweight client state management |
| Orbital mechanics | satellite.js | SGP4/SDP4 propagation from TLEs |
| Astronomy | astronomia | Sun/Moon ephemeris (Meeus algorithms) |
| Validation | Zod 4 | Runtime input validation on API boundary |
| Testing | Vitest | 109 tests across 16 files |
| Package manager | pnpm | Fast, disk-efficient |

---

## API

### `POST /api/v1/transits/search`

Search for satellite transits within a time window and travel radius.

**Request:**

```json
{
  "location": { "lat": 28.6139, "lon": 77.209 },
  "dateRange": {
    "start": "2026-05-01T00:00:00.000Z",
    "end": "2026-05-31T00:00:00.000Z"
  },
  "radiusKm": 200,
  "satellites": [25544],
  "targets": ["sun", "moon"]
}
```

**Response:**

```json
{
  "meta": {
    "location": { "lat": 28.6139, "lon": 77.209 },
    "dateRange": { "start": "...", "end": "..." },
    "radiusKm": 200,
    "computeTimeMs": 2847
  },
  "transits": [
    {
      "id": "uuid",
      "satellite": { "name": "ISS (ZARYA)", "noradId": 25544, "angularDiameterArcsec": 42.3 },
      "target": "sun",
      "time": {
        "utc": "2026-05-15T09:23:41.200Z",
        "entryUtc": "2026-05-15T09:23:40.800Z",
        "exitUtc": "2026-05-15T09:23:41.600Z",
        "durationMs": 800
      },
      "targetBody": { "altitudeDeg": 62.4, "azimuthDeg": 178.2, "angularDiameterArcsec": 1891 },
      "observationPoint": { "lat": 28.72, "lon": 77.31, "distanceFromUserKm": 14.2 },
      "groundTrack": { "centerline": [...], "corridorWidthKm": 5.8 },
      "quality": { "score": 87, "notes": "Excellent transit - long duration, high altitude" },
      "minSeparationArcsec": 12.4
    }
  ],
  "suggestions": null
}
```

### `GET /api/v1/geocode?q=Delhi`

Proxy to Nominatim for location search.

---

## Supported Satellites

| Satellite | NORAD ID | Size | Difficulty |
|---|---|---|---|
| ISS (ZARYA) | 25544 | 109m | Easy - large and bright |
| Hubble (HST) | 20580 | 13.2m | Hard - small angular size |
| Tiangong (CSS) | 54216 | 55m | Medium |

---

## Accuracy

Predictions depend on:

- **TLE freshness** - Orbital elements are cached for 2 hours. Stale TLEs degrade accuracy.
- **SGP4 model limits** - Accurate to ~1 km for LEO satellites over short prediction windows.
- **Atmospheric refraction** - Not modeled. Affects low-altitude transits (below 10 degrees).
- **Weather** - Not accounted for. Always check cloud cover before traveling.

**Recommendation:** Cross-reference predictions with [transit-finder.com](https://transit-finder.com) before traveling to an observation point. Syzygy is a planning tool, not a guarantee.

---

## Development

### Architecture Overview

```
Browser                    Next.js Server              External
  |                            |                          |
  |  POST /api/v1/search       |                          |
  |--------------------------->|                          |
  |                            |  Fetch TLEs (cached)     |
  |                            |------------------------->|  CelesTrak
  |                            |<-------------------------|
  |                            |                          |
  |                            |  SGP4 propagation        |
  |                            |  Sun/Moon ephemeris      |
  |                            |  Angular separation      |
  |                            |  Ground track sweep      |
  |                            |                          |
  |  Transit results + map     |                          |
  |<---------------------------|                          |
```

All computation happens server-side in Next.js API routes. The frontend is a thin client that sends search parameters and renders results on the map.

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage

# Full quality gate
pnpm check
```

### Key Design Decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design and [.vibe/decisions/](`.vibe/decisions/`) for Architecture Decision Records.

---

## License

[MIT](LICENSE)

---

<p align="center">
  <i>Point your telescope at the right patch of sky, at the right second, from the right spot on Earth.</i>
</p>
