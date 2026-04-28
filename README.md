<h1 align="center">
  <br>
  <code>S Y Z Y G Y</code>
  <br>
  <br>
</h1>

<p align="center">
  <b>The ISS just crossed the Sun. You had 0.6 seconds to see it. Were you in the right spot?</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/109_Tests-Passing-22c55e?style=for-the-badge" />
</p>

---

## The Problem

An astronaut-sized object screams across the Sun at 27,600 km/h. The shadow it casts on Earth is **4 km wide**. The entire event lasts **under a second**. If you are standing 5 km to the left, you see nothing. If you are 2 seconds late, it is over.

This is a satellite transit - and it is one of the hardest things to photograph in amateur astronomy.

| | |
|---|---|
| **Transit duration** | 0.3 - 1.5 seconds |
| **Ground track width** | 4 - 10 km |
| **ISS angular size** | 40-60 arcseconds (size of Jupiter) |
| **Sun/Moon disk** | 1,800 arcseconds |
| **Margin of error** | None |

There used to be a website for this. It went down. So I built one that is better.

---

## What Syzygy Does

Enter your city. Set how far you will drive. Pick a date range. Hit search.

Syzygy will:

1. **Propagate satellite orbits** using the same SGP4 model that NORAD uses to track every object in space
2. **Compute Sun and Moon positions** down to arcsecond precision using Meeus astronomical algorithms
3. **Scan millions of time-position combinations** to find the exact moments a satellite's path crosses the solar or lunar disk from somewhere near you
4. **Pinpoint the observation spot** - GPS coordinates, distance from you, Google Maps directions
5. **Show you the ground track** on a satellite imagery map so you can plan your setup

All of this runs in 2-10 seconds. No account needed. No API key. Just orbital mechanics.

---

## Quick Start

```bash
git clone https://github.com/ayush-bhardwaj/syzygy.git
cd syzygy
pnpm install
pnpm dev
```

Open **localhost:3000**. That is it.

---

## The Engine

Syzygy is not a wrapper around someone else's API. The entire transit detection pipeline is built from first principles:

```
CelesTrak TLE Data
       |
       v
  SGP4 Propagation (satellite.js)     Meeus Algorithms (astronomia)
  "Where is the ISS at time T?"       "Where is the Sun at time T?"
       |                                       |
       +------- Angular Separation < 0.25 -----+
       |           degrees? CANDIDATE.          |
       v                                        v
  Fine scan at 100ms precision          Parallax-corrected
  Find exact entry/exit times           topocentric positions
       |
       v
  Ground track sweep - find the
  best spot within your travel radius
       |
       v
  Results: where to stand, when to look,
  how long it lasts, which direction to face
```

### Two-Phase Detection

**Phase 1 - Coarse Scan**: Propagate the orbit at 60-second intervals. Identify every pass above the horizon. During each pass, sample 17 points around the observer at 10-second intervals. Flag anything within 5 degrees of the Sun or Moon.

**Phase 2 - Fine Scan**: Zoom into candidates at 0.1-second resolution. Compute exact entry time, exit time, minimum angular separation, and crossing duration. Sweep a local grid to find the optimal observation point.

This two-phase approach makes Syzygy fast enough to scan a 30-day window in under 10 seconds.

### Accuracy

- **SGP4** - Same model used by the 18th Space Defense Squadron. Sub-kilometer accuracy for LEO satellites.
- **Ephemeris** - Sun/Moon positions via Jean Meeus algorithms with topocentric parallax correction. Arcsecond-level precision.
- **TLEs** - Refreshed from CelesTrak every 2 hours. The ISS gets updated TLEs daily.

The transit corridor is 4-10 km wide. SGP4 is accurate to under 1 km. The math works.

---

## Tech Stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 6 (strict mode) |
| **Orbital mechanics** | satellite.js - SGP4/SDP4 propagation |
| **Astronomy** | astronomia - Meeus algorithms |
| **Map** | Leaflet + ESRI World Imagery |
| **Styling** | Tailwind CSS 4 |
| **State** | Zustand |
| **Validation** | Zod 4 |
| **Testing** | Vitest - 109 tests across 16 files |

---

## API

### `POST /api/v1/transits/search`

```json
{
  "location": { "lat": 28.61, "lon": 77.21 },
  "dateRange": {
    "start": "2026-05-01T00:00:00.000Z",
    "end": "2026-05-31T00:00:00.000Z"
  },
  "radiusKm": 200,
  "satellites": [25544],
  "targets": ["sun", "moon"]
}
```

Returns transit events with exact timing, observation coordinates, ground tracks, quality scores, and Google Maps navigation links.

### `GET /api/v1/geocode?q=Delhi`

Location search proxy.

---

## Project Structure

```
src/
  app/                        # Next.js App Router + API routes
  components/                 # Map, search panel, results list
  lib/
    engine/                   # The brain - SGP4, ephemeris, transit detection
    data/                     # TLE fetching, caching, satellite catalog
    store/                    # Zustand state
    config.ts                 # All tunables in one place
  types/                      # TypeScript type definitions
tests/
  unit/                       # 109 tests across 16 files
  e2e/                        # Engine validation against known transits
  fixtures/                   # Test TLEs and reference data
```

---

## Satellites

| Satellite | NORAD ID | Size | Transit Difficulty |
|---|---|---|---|
| **ISS** | 25544 | 109m | Easy - large, bright, low orbit |
| **Hubble** | 20580 | 13.2m | Hard - small angular size |
| **Tiangong** | 54216 | 55m | Medium |

---

## Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run 109 tests
pnpm check            # Full quality gate (types + lint + format + tests)
```

---

## License

**Source Available** - not open source. You may view and study the code for personal and educational use. You may not copy, redistribute, or use this software commercially without written permission. See [LICENSE](LICENSE) for full terms.

Copyright (c) 2026 Ayush Bhardwaj. All rights reserved.

---

<p align="center">
  <i>0.6 seconds. 4 km wide. One chance.</i>
  <br>
  <i>Know exactly where to stand.</i>
</p>
