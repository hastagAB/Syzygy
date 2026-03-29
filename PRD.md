# Syzygy - Product Requirements Document

## Vision
Syzygy enables anyone to find when and where a satellite will transit across the Sun or Moon, making one of astronomy's rarest events accessible to photographers and enthusiasts worldwide.

## Target Users
1. **Astrophotographers** - Want to capture ISS transit photos. Need precise timing and location.
2. **Astronomy enthusiasts** - Want to witness transits visually. Need to know where to go.
3. **Educators/outreach** - Plan group observation events. Need advance notice + location scouting.

## User Stories

### US-1: Auto-detect my location
**As a** user visiting Syzygy,
**I want** the app to detect my location automatically,
**So that** I can quickly search for transits without manual input.

**Acceptance criteria:**
- Browser geolocation prompt appears on first visit
- If granted: lat/lon auto-fills, map centers on my position
- If denied: clear message to enter location manually
- Fallback: IP-based geolocation (city-level accuracy)

### US-2: Set location manually
**As a** user who doesn't want to share location (or is planning a trip),
**I want** to type a city/address or click on the map,
**So that** I can search for transits at any location on Earth.

**Acceptance criteria:**
- Search box with autocomplete (debounced, 300ms)
- Click-on-map sets location at click point
- Map re-centers to selected location
- Location displayed as human-readable name + coordinates

### US-3: Configure search parameters
**As a** user,
**I want** to set my date range (up to 90 days), travel radius (10-500 km), and satellites,
**So that** I see only relevant transit opportunities.

**Acceptance criteria:**
- Date range picker: start/end dates, max 90 days span
- Default date range: today + 30 days
- Radius slider: 10 km to 500 km, default 100 km
- Radius visualized as circle on map
- Satellite checkboxes: ISS (default on), Hubble, Tiangong
- Target body checkboxes: Sun (default on), Moon (default on)

### US-4: Find transit events
**As a** user,
**I want** to press "Find Transits" and see all upcoming satellite transits,
**So that** I can plan my observation session.

**Acceptance criteria:**
- Loading indicator during computation (estimated 2-15 seconds)
- Results list sorted by date
- Each result shows: satellite name, transit type (Solar/Lunar), date/time, duration, distance from me, quality rating
- Results render on map: ground track centerline, observation point marker
- Clicking a result zooms map to that transit's ground track

### US-5: No events found - helpful feedback
**As a** user whose search returns no results,
**I want** the app to suggest how to find transits,
**So that** I'm not stuck with an empty screen.

**Acceptance criteria:**
- Message: "No transits found within X km in the next Y days"
- Suggestion 1: "Increase travel radius to Z km" (if a nearby transit exists)
- Suggestion 2: "Extend date range to [date]" (if a future transit exists within radius)
- Suggestion 3: "Try adding more satellites" (if only ISS was selected)
- Suggestions are actionable (click to apply)

### US-6: View transit details
**As a** user who found a transit event,
**I want** to see all observation details,
**So that** I can plan my trip and camera setup.

**Acceptance criteria:**
- Satellite: name, NORAD ID, angular diameter (arcseconds)
- Timing: UTC time, local time, duration in milliseconds
- Location: optimal observation point (lat/lon), distance from my location
- Target body: Sun/Moon altitude, azimuth, angular diameter
- Ground track: centerline polyline + visibility corridor polygon on map
- Navigation: "Get Directions" link (opens Google Maps / Apple Maps)

### US-7: Accuracy awareness
**As a** user planning weeks in advance,
**I want** to understand the prediction accuracy,
**So that** I know whether to re-check closer to the date.

**Acceptance criteria:**
- Events < 7 days out: no disclaimer
- Events 7-14 days out: "Predictions may shift by a few km. Re-check 2-3 days before."
- Events > 14 days out: "Approximate - TLE data degrades over time. Treat as planning guide."

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Search response time (30 days, 1 satellite, 100 km) | < 5 seconds |
| Search response time (90 days, 3 satellites, 300 km) | < 30 seconds |
| Mobile responsive | Full functionality on 375px+ screens |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Uptime | Best-effort (hobby project, Vercel free tier) |
| No user data stored | No cookies, no accounts, no analytics (initially) |
| Accessibility | WCAG 2.1 AA for core search flow |

## Out of Scope (v1)
- User accounts / saved searches
- Push notifications / email alerts
- Weather integration
- Community photo gallery
- Offline/PWA support
- Satellite 3D models
- Non-Earth observers (Mars, etc.)

## Success Metrics
1. Engine correctly predicts known past ISS transits (validated against transit-finder.com data)
2. Full search flow works on desktop and mobile
3. Load time < 3 seconds (initial page load)
4. Users can go from "open app" to "seeing a transit result" in < 30 seconds
