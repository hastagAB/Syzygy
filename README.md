<div align="center">

<pre>
███████╗██╗   ██╗███████╗██╗   ██╗ ██████╗██╗   ██╗
██╔════╝╚██╗ ██╔╝╚══███╔╝╚██╗ ██╔╝██╔════╝╚██╗ ██╔╝
███████╗ ╚████╔╝   ███╔╝  ╚████╔╝ ██║  ███╗╚████╔╝
╚════██║  ╚██╔╝   ███╔╝    ╚██╔╝  ██║   ██║ ╚██╔╝
███████║   ██║   ███████╗   ██║   ╚██████╔╝  ██║
╚══════╝   ╚═╝   ╚══════╝   ╚═╝    ╚═════╝   ╚═╝
</pre>

### **Satellite Transit Finder**

*The ISS just crossed the Sun. You had 0.6 seconds to see it.*
*Were you in the right spot?*

<br>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/109_Tests-Passing-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](tests/)
[![License](https://img.shields.io/badge/License-Source_Available-ef4444?style=for-the-badge)](LICENSE)

</div>

<br>

---

<br>

<div align="center">

### `THE PROBLEM`

</div>

<br>

> An astronaut-sized object screams across the Sun at **27,600 km/h**.
> The shadow it casts on Earth is **4 km wide**.
> The entire event lasts **under a second**.
>
> Stand 5 km to the left? You see nothing.
> Two seconds late? It is over.

<br>

<table align="center">
<tr><td align="center"><b>Transit Duration</b></td><td align="center"><b>Ground Track</b></td><td align="center"><b>ISS Angular Size</b></td><td align="center"><b>Margin of Error</b></td></tr>
<tr><td align="center"><code>0.3 - 1.5 sec</code></td><td align="center"><code>4 - 10 km</code></td><td align="center"><code>~50 arcsec</code></td><td align="center"><code>Zero</code></td></tr>
</table>

<br>

<div align="center">
<i>There used to be a website for this. It went down two years ago.</i>
<br>
<b>So I built one that is better.</b>
</div>

<br>

---

<br>

<div align="center">

### `WHAT IT DOES`

</div>

<br>

```
  Enter your city.  Set how far you'll drive.  Pick a date range.  Hit search.
```

<br>

<table>
<tr>
<td width="50%">

**1. Propagates satellite orbits**
Same SGP4 model NORAD uses to track every object in space

**2. Computes Sun/Moon positions**
Arcsecond precision via Meeus astronomical algorithms

**3. Scans millions of combinations**
Finds the exact moments a satellite crosses the solar/lunar disk

</td>
<td width="50%">

**4. Pinpoints the observation spot**
GPS coordinates + distance + Google Maps directions

**5. Shows the ground track**
Interactive satellite imagery map for planning your setup

**6. Rates each transit**
Quality score 0-100 based on duration, altitude, separation

</td>
</tr>
</table>

<br>

<div align="center">
<code>All of this runs in 2-10 seconds. No account. No API key. Just orbital mechanics.</code>
</div>

<br>

---

<br>

<div align="center">

### `QUICK START`

</div>

<br>

```bash
git clone https://github.com/hastagAB/Syzygy.git
cd syzygy
pnpm install
pnpm dev
# Open localhost:3000 - that's it.
```

<br>

---

<br>

<div align="center">

### `THE ENGINE`

</div>

<br>

This is not a wrapper around someone else's API. The entire detection pipeline is built from first principles:

```
                    ┌─────────────────────┐
                    │   CelesTrak TLEs    │
                    │  (refreshed / 2hr)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              v                                 v
   ┌─────────────────────┐          ┌─────────────────────┐
   │  SGP4 Propagation   │          │  Meeus Ephemeris    │
   │  satellite.js       │          │  astronomia         │
   │                     │          │                     │
   │  "Where is the ISS  │          │  "Where is the Sun  │
   │   at time T?"       │          │   at time T?"       │
   └──────────┬──────────┘          └──────────┬──────────┘
              │                                 │
              └────────────────┬────────────────┘
                               │
                               v
                 ┌───────────────────────────┐
                 │   Angular Separation      │
                 │   < target radius?        │
                 │                           │
                 │   YES = TRANSIT DETECTED  │
                 └─────────────┬─────────────┘
                               │
                               v
                 ┌───────────────────────────┐
                 │   Fine scan @ 100ms       │
                 │   Entry time, exit time   │
                 │   Ground track sweep      │
                 │   Optimal obs. point      │
                 └───────────────────────────┘
```

<br>

<details>
<summary><b>Two-Phase Detection (click to expand)</b></summary>
<br>

**Phase 1 - Coarse Scan**

Propagate the orbit at 60-second intervals. Identify every pass above the horizon. During each pass, sample 17 points around the observer at 10-second intervals. Flag anything within 5 degrees of the Sun or Moon.

**Phase 2 - Fine Scan**

Zoom into candidates at 0.1-second resolution. Compute exact entry time, exit time, minimum angular separation, and crossing duration. Sweep a local grid to find the optimal observation point.

This two-phase approach scans a 30-day window in under 10 seconds.

</details>

<details>
<summary><b>Accuracy (click to expand)</b></summary>
<br>

| Component | Precision | Source |
|---|---|---|
| Satellite position | < 1 km | SGP4 (18th Space Defense Squadron standard) |
| Sun/Moon position | arcsecond-level | Meeus algorithms + topocentric parallax |
| TLE freshness | 2-hour cache | CelesTrak (ISS updated daily) |

The transit corridor is 4-10 km wide. SGP4 is accurate to under 1 km. The math works.

</details>

<br>

---

<br>

<div align="center">

### `TECH STACK`

</div>

<br>

| Layer | Tech | Why |
|:---:|---|---|
| ⚡ | **Next.js 16** (App Router, Turbopack) | Full-stack + fast dev |
| 🔒 | **TypeScript 6** (strict mode) | Zero runtime surprises |
| 🛰️ | **satellite.js** | NORAD-standard SGP4/SDP4 |
| 🌙 | **astronomia** | Jean Meeus algorithms |
| 🗺️ | **Leaflet** + ESRI World Imagery | No API key needed |
| 🎨 | **Tailwind CSS 4** | Dark theme, utility-first |
| 📦 | **Zustand** | Minimal state management |
| ✅ | **Vitest** | 109 tests, 16 files |

<br>

---

<br>

<div align="center">

### `API`

</div>

<br>

#### `POST /api/v1/transits/search`

```jsonc
// Request
{
  "location": { "lat": 28.61, "lon": 77.21 },
  "dateRange": { "start": "2026-05-01T00:00:00Z", "end": "2026-05-31T00:00:00Z" },
  "radiusKm": 200,
  "satellites": [25544],        // NORAD IDs
  "targets": ["sun", "moon"]
}

// Response: transit events with exact timing, GPS observation point,
// ground tracks, quality scores, and Google Maps navigation links.
```

#### `GET /api/v1/geocode?q=Delhi`

Location search proxy (Nominatim).

<br>

---

<br>

<div align="center">

### `SUPPORTED SATELLITES`

</div>

<br>

| | Satellite | NORAD ID | Size | Difficulty |
|:---:|---|:---:|:---:|---|
| 🛰️ | **ISS (ZARYA)** | 25544 | 109m | Easy - large, bright, low orbit |
| 🔭 | **Hubble (HST)** | 20580 | 13.2m | Hard - small angular size |
| 🏗️ | **Tiangong (CSS)** | 54216 | 55m | Medium |

<br>

---

<br>

<div align="center">

### `SCRIPTS`

</div>

<br>

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build
pnpm test             # 109 tests
pnpm check            # Full quality gate: types + lint + format + tests
```

<br>

---

<br>

<div align="center">

### `LICENSE`

**Source Available** - not open source.

You may view and study the code for personal/educational use.
You may **not** copy, redistribute, or deploy commercially without written permission.

See [LICENSE](LICENSE) for full terms.

<br>

**Copyright (c) 2026 Ayush Bhardwaj. All rights reserved.**

</div>

<br>

---

<br>

<div align="center">

```
0.6 seconds.  4 km wide.  One chance.
```

**Know exactly where to stand.**

</div>
