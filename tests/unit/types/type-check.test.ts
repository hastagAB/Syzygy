import { describe, it, expect } from "vitest";
import type {
  LatLon,
  LatLonAlt,
  TopocentricPosition,
  ECIPosition,
  TLERecord,
  SatelliteInfo,
  TransitEvent,
  SearchParams,
  CandidateWindow,
  SearchResult,
} from "@/types";

describe("type definitions", () => {
  it("should_create_valid_lat_lon", () => {
    const pos: LatLon = { lat: 45.4642, lon: 9.19 };
    expect(pos.lat).toBe(45.4642);
    expect(pos.lon).toBe(9.19);
  });

  it("should_create_valid_lat_lon_alt", () => {
    const pos: LatLonAlt = { lat: 0, lon: 0, altKm: 408 };
    expect(pos.altKm).toBe(408);
  });

  it("should_create_valid_topocentric_position", () => {
    const topo: TopocentricPosition = {
      azimuthDeg: 180,
      elevationDeg: 45,
      rangeKm: 500,
    };
    expect(topo.elevationDeg).toBe(45);
  });

  it("should_create_valid_eci_position", () => {
    const eci: ECIPosition = { x: 6778, y: 0, z: 0 };
    expect(eci.x).toBe(6778);
  });

  it("should_create_valid_tle_record", () => {
    const tle: TLERecord = {
      name: "ISS (ZARYA)",
      noradId: 25544,
      line1: "1 25544U 98067A   24001.00000000  .00000000  00000-0  00000-0 0    09",
      line2: "2 25544  51.6400   0.0000 0007000   0.0000   0.0000 15.50000000    09",
      epoch: new Date("2024-01-01T00:00:00Z"),
    };
    expect(tle.noradId).toBe(25544);
    expect(tle.name).toBe("ISS (ZARYA)");
  });

  it("should_create_valid_satellite_info", () => {
    const sat: SatelliteInfo = {
      id: "ISS",
      name: "ISS (ZARYA)",
      noradId: 25544,
      sizeMeters: 109,
      difficulty: "easy",
      description: "Largest angular diameter of any satellite",
    };
    expect(sat.difficulty).toBe("easy");
  });

  it("should_create_valid_candidate_window", () => {
    const cw: CandidateWindow = {
      start: new Date("2026-05-17T14:30:00Z"),
      end: new Date("2026-05-17T14:31:00Z"),
      minSeparationDeg: 0.5,
      target: "sun",
      satelliteNoradId: 25544,
    };
    expect(cw.target).toBe("sun");
    expect(cw.minSeparationDeg).toBe(0.5);
  });

  it("should_create_valid_search_params", () => {
    const params: SearchParams = {
      location: { lat: 45.4642, lon: 9.19 },
      dateRange: {
        start: new Date("2026-05-01"),
        end: new Date("2026-06-30"),
      },
      radiusKm: 100,
      satellites: ["ISS"],
      targets: ["sun", "moon"],
    };
    expect(params.satellites).toContain("ISS");
    expect(params.targets).toHaveLength(2);
  });

  it("should_create_valid_transit_event", () => {
    const event: TransitEvent = {
      id: "iss-sun-20260517-143022",
      satellite: {
        name: "ISS (ZARYA)",
        noradId: 25544,
        angularDiameterArcsec: 52.3,
      },
      target: "sun",
      time: {
        utc: new Date("2026-05-17T14:30:22.450Z"),
        durationMs: 870,
        entryUtc: new Date("2026-05-17T14:30:22.000Z"),
        exitUtc: new Date("2026-05-17T14:30:22.870Z"),
      },
      observationPoint: {
        lat: 45.5012,
        lon: 9.234,
        distanceFromUserKm: 5.2,
      },
      targetBody: {
        altitudeDeg: 58.3,
        azimuthDeg: 195.7,
        angularDiameterArcsec: 1891,
      },
      groundTrack: {
        centerline: [
          { lat: 45.48, lon: 9.1 },
          { lat: 45.5, lon: 9.23 },
        ],
        corridorWidthKm: 7.2,
      },
      quality: {
        score: 0.85,
        notes: "High altitude, near-center crossing",
      },
      minSeparationArcsec: 120,
    };
    expect(event.target).toBe("sun");
    expect(event.time.durationMs).toBe(870);
  });

  it("should_create_valid_search_result", () => {
    const result: SearchResult = {
      meta: {
        location: { lat: 45.4642, lon: 9.19 },
        dateRange: { start: "2026-05-01", end: "2026-06-30" },
        radiusKm: 100,
        computeTimeMs: 4823,
        tleEpoch: "2026-04-28T06:00:00Z",
      },
      transits: [],
      suggestions: {
        increaseRadius: {
          suggestedKm: 200,
          reason: "Nearest transit found at 187 km from your location",
        },
      },
    };
    expect(result.transits).toHaveLength(0);
    expect(result.suggestions?.increaseRadius?.suggestedKm).toBe(200);
  });
});
