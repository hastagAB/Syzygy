import { describe, it, expect } from "vitest";
import {
  SATELLITE_CATALOG,
  getSatelliteByNoradId,
  getSatelliteById,
} from "@/lib/data/satellite-catalog";

describe("satellite catalog", () => {
  it("should_contain_iss_hubble_tiangong", () => {
    const names = SATELLITE_CATALOG.map((s) => s.id);
    expect(names).toContain("iss");
    expect(names).toContain("hst");
    expect(names).toContain("tiangong");
  });

  it("should_have_valid_norad_ids", () => {
    for (const sat of SATELLITE_CATALOG) {
      expect(sat.noradId).toBeGreaterThan(0);
      expect(Number.isInteger(sat.noradId)).toBe(true);
    }
  });

  it("should_lookup_by_norad_id", () => {
    const iss = getSatelliteByNoradId(25544);
    expect(iss).toBeDefined();
    expect(iss!.name).toContain("ISS");
    expect(iss!.sizeMeters).toBe(109);
  });

  it("should_lookup_by_id", () => {
    const hst = getSatelliteById("hst");
    expect(hst).toBeDefined();
    expect(hst!.noradId).toBe(20580);
  });

  it("should_return_undefined_for_unknown_id", () => {
    expect(getSatelliteByNoradId(99999)).toBeUndefined();
    expect(getSatelliteById("nonexistent")).toBeUndefined();
  });
});
